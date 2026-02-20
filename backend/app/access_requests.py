from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Body, HTTPException, Query

router = APIRouter()

# In-memory store (MVP). In producción: DB (Cloud SQL / Firestore) + audit/trace.
_REQUESTS: Dict[str, dict] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def seed_if_empty() -> None:
    """Seed minimal demo data only once."""
    if _REQUESTS:
        return

    rid = str(uuid4())
    _REQUESTS[rid] = {
        "id": rid,
        "linked_resource": "bigquery://demo.retail.sales_daily_gold",
        "reason": "Necesito el dataset para análisis/reporting.",
        "requested_role": "READER",
        "access_level": "READER",
        "requester_email": "user@company.com",
        "data_owner": "data.owner@company.com",
        "data_steward": "data.steward@company.com",
        "status": "PENDING",
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "decision": None,
        "decision_by": None,
        "decision_at": None,
        "decision_reason": None,
    }


@router.post("/access-requests")
def create_access_request(payload: dict = Body(...)):
    seed_if_empty()

    # Required fields (keep it simple)
    required = ["linked_resource", "reason", "requester_email", "access_level"]
    missing = [k for k in required if not payload.get(k)]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required fields: {', '.join(missing)}")

    rid = str(uuid4())
    req = {
        "id": rid,
        "linked_resource": payload["linked_resource"],
        "reason": payload["reason"],
        "requested_role": payload.get("requested_role", payload.get("access_level", "READER")),
        "access_level": payload.get("access_level", "READER"),
        "requester_email": payload["requester_email"],
        "data_owner": payload.get("data_owner"),
        "data_steward": payload.get("data_steward"),
        "status": "PENDING",
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "decision": None,
        "decision_by": None,
        "decision_at": None,
        "decision_reason": None,
    }
    _REQUESTS[rid] = req
    return {"ok": True, "item": req}


@router.get("/access-requests")
def list_access_requests(
    status: str = Query("PENDING", description="PENDING|APPROVED|REJECTED"),
    limit: int = Query(50, ge=1, le=500),
):
    seed_if_empty()

    items = list(_REQUESTS.values())
    if status:
        items = [x for x in items if x.get("status") == status]

    # latest first
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"ok": True, "items": items[:limit]}


def _get_or_404(rid: str) -> dict:
    req = _REQUESTS.get(rid)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.post("/access-requests/{request_id}/approve")
def approve_access_request(
    request_id: str,
    actor_email: str = Body(..., embed=True),
    comment: Optional[str] = Body(None, embed=True),
):
    seed_if_empty()
    req = _get_or_404(request_id)
    if req["status"] != "PENDING":
        raise HTTPException(status_code=409, detail=f"Request is {req['status']}, cannot approve")

    req["status"] = "APPROVED"
    req["decision"] = "APPROVED"
    req["decision_by"] = actor_email
    req["decision_at"] = _now_iso()
    req["decision_reason"] = comment
    req["updated_at"] = _now_iso()

    # En producción: aquí disparas workflow real (Dataplex / BigQuery IAM / Datasets / row-level security, etc.)
    return {"ok": True, "item": req}


@router.post("/access-requests/{request_id}/reject")
def reject_access_request(
    request_id: str,
    actor_email: str = Body(..., embed=True),
    comment: Optional[str] = Body(None, embed=True),
):
    seed_if_empty()
    req = _get_or_404(request_id)
    if req["status"] != "PENDING":
        raise HTTPException(status_code=409, detail=f"Request is {req['status']}, cannot reject")

    req["status"] = "REJECTED"
    req["decision"] = "REJECTED"
    req["decision_by"] = actor_email
    req["decision_at"] = _now_iso()
    req["decision_reason"] = comment
    req["updated_at"] = _now_iso()

    return {"ok": True, "item": req}
