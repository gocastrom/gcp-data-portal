"""
Access Request system

Production version:
replace DB with:
- BigQuery
- Firestore
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends

from app.auth import get_current_user, require_role

router = APIRouter()

DB = {}

def now():
    return datetime.utcnow().isoformat()

@router.post("/access-requests")
def create(req: dict, user=Depends(get_current_user)):

    id = str(uuid.uuid4())

    record = {
        "id": id,
        "linked_resource": req["linked_resource"],
        "requester_email": user["email"],
        "access_level": req["access_level"],
        "reason": req.get("reason"),
        "data_owner": req["data_owner"],
        "status": "PENDING",
        "created_at": now(),
        "approved_at": None,
        "rejected_at": None
    }

    DB[id] = record

    return record


@router.get("/access-requests")
def list(
    status: str = None,
    approver_email: str = None,
    user=Depends(get_current_user)
):

    results = list(DB.values())

    if status:
        results = [r for r in results if r["status"] == status]

    if approver_email:
        results = [r for r in results if r["data_owner"] == approver_email]

    return {
        "items": results,
        "total": len(results)
    }


@router.post("/access-requests/{id}/approve")
def approve(id: str, user=Depends(get_current_user)):

    require_role(user, ["DATA_OWNER","ADMIN"])

    r = DB[id]

    r["status"] = "APPROVED"
    r["approved_at"] = now()

    return r


@router.post("/access-requests/{id}/reject")
def reject(id: str, user=Depends(get_current_user)):

    require_role(user, ["DATA_OWNER","ADMIN"])

    r = DB[id]

    r["status"] = "REJECTED"
    r["rejected_at"] = now()

    return r
