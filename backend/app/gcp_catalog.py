from __future__ import annotations

import os
from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter()

def _is_mock() -> bool:
    return os.getenv("MOCK_MODE", "true").lower() in ("1", "true", "yes", "y")

# Catálogo demo (MVP)
_DEMO = [
    {
        "display_name": "sales_daily_gold",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.retail.sales_daily_gold",
        "description": "Ventas diarias consolidadas (Gold layer). KPI ventas, margen, tickets.",
        "domain": "retail",
        "data_owner": "data.owner@company.com",
        "data_steward": "data.steward@company.com",
        "tags": ["gold", "sales", "kpi"],
    },
    {
        "display_name": "customers_master",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.crm.customers_master",
        "description": "Maestro de clientes (CRM). Identificadores, atributos, segmentación.",
        "domain": "crm",
        "data_owner": "crm.owner@company.com",
        "data_steward": "crm.steward@company.com",
        "tags": ["master", "customer", "pii"],
    },
    {
        "display_name": "inventory_snapshot_silver",
        "type": "TABLE",
        "system": "BIGQUERY",
        "linked_resource": "bigquery://demo.retail.inventory_snapshot_silver",
        "description": "Inventario por tienda y SKU (Silver). Snapshot diario.",
        "domain": "retail",
        "data_owner": "data.owner@company.com",
        "data_steward": "data.steward@company.com",
        "tags": ["silver", "inventory", "stock"],
    },
]

@router.get("/search")
def search(
    q: str = Query(..., min_length=1),
    system: Optional[str] = Query(None, description="BIGQUERY|DATAPLEX|ANY"),
    type: Optional[str] = Query(None, description="TABLE|DATASET|ENTRY"),
    page_size: int = Query(25, ge=1, le=200),
):
    """
    MVP:
    - MOCK_MODE=true: filtra sobre _DEMO
    - Modo real: aquí iría Dataplex Search / Data Catalog / BigQuery metadata
    """
    if _is_mock():
        qq = q.lower().strip()
        items = []
        for a in _DEMO:
            hay = " ".join([
                a.get("display_name", ""),
                a.get("description", ""),
                a.get("linked_resource", ""),
                " ".join(a.get("tags", [])),
                a.get("domain", ""),
            ]).lower()
            if qq in hay:
                items.append(a)

        if system and system.upper() != "ANY":
            items = [x for x in items if (x.get("system") or "").upper() == system.upper()]
        if type and type.upper() != "ANY":
            items = [x for x in items if (x.get("type") or "").upper() == type.upper()]

        return {"ok": True, "mode": "mock", "items": items[:page_size]}

    return {"ok": True, "mode": "real_not_implemented", "items": [], "message": "Usa MOCK_MODE=true para demo."}
