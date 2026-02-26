from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(tags=["access-requests"])

# -----------------------------
# MVP MOCK STORAGE (in-memory)
# -----------------------------
# En producción:
# - Persistir en Firestore / Cloud SQL
# - Auditar en Cloud Logging / BigQuery
# - Enforce auth via IAP/OAuth + verify JWT
# - Validar IAM real (BigQuery / Dataplex)
_DB: Dict[str, Dict[str, Any]] = {}


class AccessRequestCreate(BaseModel):
    linked_resource: str = Field(..., description="bigquery://... or dataplex://...")
    requester_email: str
    access_level: str = Field(..., description="READER/WRITER")
    reason: str
    data_owner: str = Field(..., description="Único aprobador (owner) en este MVP")


class AccessRequestDecision(BaseModel):
    decision: str = Field(..., description="APPROVED or REJECTED")
    decided_by: str = Field(..., description="Email del que decide (owner/admin)")


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


@router.post("/access-requests")
def create_access_request(payload: AccessRequestCreate):
    """
    MVP:
      - Crea solicitud PENDING.
      - Owner es el ÚNICO aprobador (requisito tuyo).
    Producción:
      - Validar requester autenticado (IAP/OAuth)
      - Validar que linked_resource existe en Dataplex/BigQuery
      - Enviar notificación (PubSub/Email/Chat)
    """
    rid = str(uuid.uuid4())
    item = {
        "id": rid,
        "linked_resource": payload.linked_resource,
        "requester_email": payload.requester_email,
        "access_level": payload.access_level,
        "reason": payload.reason,
        "data_owner": payload.data_owner,
        "status": "PENDING",
        "created_at": _now_iso(),
        "decided_at": None,
        "decided_by": None,
        "decision": None,
    }
    _DB[rid] = item
    return {"ok": True, "item": item}


@router.get("/access-requests")
def list_access_requests(
    status: Optional[str] = Query(default=None, description="PENDING/APPROVED/REJECTED"),
    approver_email: Optional[str] = Query(default=None, description="Email del owner que aprueba"),
):
    """
    MVP:
      - Si viene approver_email: filtra por data_owner=approver_email
      - Si no viene approver_email: devuelve todo (para ADMIN mock)
    Producción:
      - Autorizar por rol (owner/admin) a ver solicitudes
    """
    items = list(_DB.values())

    if approver_email:
        items = [x for x in items if x.get("data_owner") == approver_email]

    if status:
        items = [x for x in items if x.get("status") == status]

    # Orden newest first
    items.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    return {"items": items, "total": len(items)}


@router.post("/access-requests/{request_id}/decision")
def decide_access_request(request_id: str, payload: AccessRequestDecision):
    """
    MVP:
      - Solo permite decidir si decided_by == data_owner (o es admin en prod)
      - Cambia status a APPROVED/REJECTED
    Producción:
      - Aplicar IAM real (BigQuery dataset/table IAM o Dataplex policy)
      - Registrar auditoría
    """
    item = _DB.get(request_id)
    if not item:
        raise HTTPException(status_code=404, detail="Request not found")

    owner = item.get("data_owner")
    if payload.decided_by != owner:
        # En producción permitir ADMIN también
        raise HTTPException(status_code=403, detail="Only Data Owner can approve/reject in this MVP")

    decision = payload.decision.upper().strip()
    if decision not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=400, detail="decision must be APPROVED or REJECTED")

    item["status"] = decision
    item["decision"] = decision
    item["decided_by"] = payload.decided_by
    item["decided_at"] = _now_iso()

    _DB[request_id] = item
    return {"ok": True, "item": item}
