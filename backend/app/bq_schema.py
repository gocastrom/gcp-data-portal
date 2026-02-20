from typing import Any, Dict, List, Optional, Tuple
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field
from google.cloud import bigquery

router = APIRouter()

def _parse_bigquery_linked_resource(linked_resource: str) -> Tuple[str, str, str]:
    """
    linked_resource format (MVP):
      bigquery://<project>.<dataset>.<table>
    """
    if not linked_resource.startswith("bigquery://"):
        raise ValueError("Only bigquery:// is supported in this endpoint")
    rest = linked_resource.replace("bigquery://", "", 1)
    parts = rest.split(".")
    if len(parts) != 3:
        raise ValueError("Expected bigquery://project.dataset.table")
    return parts[0], parts[1], parts[2]

def _bq_client() -> bigquery.Client:
    # Usa ADC / GOOGLE_APPLICATION_CREDENTIALS
    return bigquery.Client()

def _actor(req: Request) -> Dict[str, str]:
    # MVP: actor por headers (front)
    # X-User-Email, X-User-Role
    return {
        "email": req.headers.get("x-user-email", "user@company.com"),
        "role": req.headers.get("x-user-role", "USER"),
    }

def _is_approver(role: str) -> bool:
    role = (role or "").upper()
    return role in ("ADMIN", "DATA_OWNER", "DATA_STEWARD", "APPROVER")

@router.get("/assets/schema")
def get_schema(
    request: Request,
    linked_resource: str = Query(..., description="bigquery://project.dataset.table"),
) -> Dict[str, Any]:
    actor = _actor(request)

    # MOCK MODE (si quieres demo sin GCP): header X-Mock: 1
    if request.headers.get("x-mock", "0") == "1":
        return {
            "linked_resource": linked_resource,
            "system": "BIGQUERY",
            "table_description": "Mock description from catalog.",
            "columns": [
                {"name": "date", "type": "DATE", "mode": "NULLABLE", "description": "Fecha del movimiento"},
                {"name": "store_id", "type": "STRING", "mode": "NULLABLE", "description": "Identificador tienda"},
                {"name": "sku", "type": "STRING", "mode": "NULLABLE", "description": "Código producto"},
                {"name": "sales_qty", "type": "INT64", "mode": "NULLABLE", "description": "Unidades vendidas"},
            ],
            "can_edit": _is_approver(actor["role"]),
            "actor": actor,
        }

    try:
        project, dataset, table = _parse_bigquery_linked_resource(linked_resource)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    client = _bq_client()
    table_ref = f"{project}.{dataset}.{table}"

    try:
        t = client.get_table(table_ref)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read BigQuery table metadata: {e}")

    cols: List[Dict[str, Any]] = []
    for f in t.schema:
        cols.append(
            {
                "name": f.name,
                "type": f.field_type,
                "mode": f.mode,
                "description": f.description or "",
            }
        )

    return {
        "linked_resource": linked_resource,
        "system": "BIGQUERY",
        "table_description": t.description or "",
        "columns": cols,
        "can_edit": _is_approver(actor["role"]),
        "actor": actor,
    }

class ColumnUpdate(BaseModel):
    name: str
    description: str = ""

class SchemaUpdateRequest(BaseModel):
    linked_resource: str
    table_description: Optional[str] = None
    columns: List[ColumnUpdate] = Field(default_factory=list)

@router.patch("/assets/schema")
def update_schema(request: Request, payload: SchemaUpdateRequest) -> Dict[str, Any]:
    actor = _actor(request)
    if not _is_approver(actor["role"]):
        raise HTTPException(status_code=403, detail="Not allowed to edit catalog metadata")

    # MOCK MODE
    if request.headers.get("x-mock", "0") == "1":
        return {"ok": True, "mode": "mock", "updated_by": actor, "linked_resource": payload.linked_resource}

    try:
        project, dataset, table = _parse_bigquery_linked_resource(payload.linked_resource)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    client = _bq_client()
    table_ref = f"{project}.{dataset}.{table}"

    try:
        t = client.get_table(table_ref)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load BigQuery table: {e}")

    # Map updates by column name
    updates = {c.name: c.description for c in payload.columns}

    # Apply updates to schema
    new_schema = []
    for f in t.schema:
        desc = f.description or ""
        if f.name in updates:
            desc = updates[f.name]
        new_schema.append(
            bigquery.SchemaField(
                name=f.name,
                field_type=f.field_type,
                mode=f.mode,
                description=desc,
                fields=f.fields,
                policy_tags=f.policy_tags,
                precision=f.precision,
                scale=f.scale,
                max_length=f.max_length,
            )
        )

    if payload.table_description is not None:
        t.description = payload.table_description

    t.schema = new_schema

    try:
        client.update_table(t, ["schema", "description"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update BigQuery schema/description: {e}")

    return {"ok": True, "updated_by": actor, "linked_resource": payload.linked_resource}
