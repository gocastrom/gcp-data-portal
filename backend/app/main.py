import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)

from app.access_requests import (  # noqa: E402
    init_db,
    create_request,
    list_requests,
    get_request,
    add_approval,
    approvals_for_request,
    set_status,
)

app = FastAPI(title="GCP Data Portal API", version="0.6")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # prod: restringe
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# init DB on startup
@app.on_event("startup")
def _startup():
    init_db()

@app.get("/health")
def health():
    return {
        "ok": True,
        "project": os.getenv("GOOGLE_CLOUD_PROJECT", "your-gcp-project-id"),
        "mode": "public-mvp",
    }

# ---------- SEARCH (placeholder for now) ----------
@app.get("/search")
def search(
    q: str = Query(..., min_length=2),
    page_size: int = Query(20, ge=1, le=100),
    system: Optional[str] = Query(None),
):
    # MVP public: returns mock results so frontend is testable without GCP.
    # Later we will switch to Dataplex/Data Catalog real search.
    items = [
        {
            "display_name": "sales_daily_gold",
            "description": "Daily sales aggregated per store and SKU",
            "linked_resource": "//bigquery.googleapis.com/projects/your-project/datasets/gold/tables/sales_daily",
            "integrated_system": "BIGQUERY",
            "type": "TABLE",
        },
        {
            "display_name": "customer_master",
            "description": "Customer master dataset",
            "linked_resource": "//bigquery.googleapis.com/projects/your-project/datasets/mdm/tables/customer_master",
            "integrated_system": "BIGQUERY",
            "type": "TABLE",
        },
    ]
    if system:
        items = [x for x in items if system.upper() in x["integrated_system"]]
    return {"query": q, "count": len(items[:page_size]), "items": items[:page_size]}

# ---------- ACCESS REQUESTS ----------
class AccessRequestIn(BaseModel):
    requester_email: str
    linked_resource: str
    access_level: str  # e.g. READ_TABLE, READ_DATASET
    reason: str

@app.post("/access-requests")
def create_access_request(payload: AccessRequestIn):
    rid = create_request(
        requester_email=payload.requester_email.strip(),
        linked_resource=payload.linked_resource.strip(),
        access_level=payload.access_level.strip(),
        reason=payload.reason.strip(),
    )
    return {"ok": True, "request_id": rid}

@app.get("/access-requests")
def get_access_requests(status: str = "PENDING"):
    return {"items": list_requests(status=status)}

@app.get("/access-requests/{request_id}")
def get_access_request(request_id: int):
    try:
        req = get_request(request_id)
        req["approvals"] = approvals_for_request(request_id)
        return req
    except KeyError:
        raise HTTPException(status_code=404, detail="Request not found")

# ---------- APPROVALS ----------
class ApprovalIn(BaseModel):
    role: str  # IT_OWNER | DATA_OWNER | DATA_STEWARD
    approver_email: str
    decision: str  # APPROVED | REJECTED

REQUIRED_APPROVALS = {"DATA_OWNER", "DATA_STEWARD"}  # MVP rule

@app.post("/access-requests/{request_id}/approve")
def approve_request(request_id: int, payload: ApprovalIn):
    try:
        _ = get_request(request_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Request not found")

    role = payload.role.strip().upper()
    decision = payload.decision.strip().upper()

    if role not in {"IT_OWNER", "DATA_OWNER", "DATA_STEWARD"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    if decision not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Invalid decision")

    add_approval(request_id, role, payload.approver_email.strip(), decision)

    approvals = approvals_for_request(request_id)

    # If any rejection => REJECTED
    if any(d == "REJECTED" for d in approvals.values()):
        set_status(request_id, "REJECTED")
        return {"ok": True, "status": "REJECTED", "approvals": approvals}

    # If required roles approved => APPROVED (provisioning will come later)
    if REQUIRED_APPROVALS.issubset({r for r, d in approvals.items() if d == "APPROVED"}):
        set_status(request_id, "APPROVED")
        return {"ok": True, "status": "APPROVED", "approvals": approvals}

    return {"ok": True, "status": "PENDING", "approvals": approvals}
