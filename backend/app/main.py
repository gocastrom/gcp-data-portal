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
from app.catalog_provider import search_assets  # noqa: E402
from app.bq_preview import preview_table  # noqa: E402
from app.iam_provisioning import grant_bigquery_viewer  # noqa: E402


app = FastAPI(title="GCP Data Portal API", version="0.8")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # prod: restringe
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    init_db()

@app.get("/health")
def health():
    return {
        "ok": True,
        "project": os.getenv("GOOGLE_CLOUD_PROJECT", "your-gcp-project-id"),
        "catalog_provider": os.getenv("CATALOG_PROVIDER", "mock"),
        "provisioning_enabled": os.getenv("ENABLE_PROVISIONING", "false").lower() == "true",
    }

# ---------- SEARCH ----------
@app.get("/search")
def search(
    q: str = Query(..., min_length=2),
    page_size: int = Query(20, ge=1, le=100),
):
    try:
        items = search_assets(q=q, page_size=page_size)
        return {"query": q, "count": len(items), "items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {e}")

# ---------- ASSET PREVIEW ----------
@app.get("/assets/preview")
def asset_preview(
    linked_resource: str = Query(..., min_length=10),
    limit: int = Query(10, ge=1, le=100),
):
    return preview_table(linked_resource=linked_resource, limit=limit)

# ---------- ACCESS REQUESTS ----------
class AccessRequestIn(BaseModel):
    requester_email: str
    linked_resource: str
    access_level: str  # READ_TABLE | READ_DATASET (MVP)
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
        req = get_request(request_id)
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

    if any(d == "REJECTED" for d in approvals.values()):
        set_status(request_id, "REJECTED")
        return {"ok": True, "status": "REJECTED", "approvals": approvals}

    if REQUIRED_APPROVALS.issubset({r for r, d in approvals.items() if d == "APPROVED"}):
        set_status(request_id, "APPROVED")

        # Provisioning (optional)
        if os.getenv("ENABLE_PROVISIONING", "false").lower() == "true":
            try:
                # MVP: grant dataset-level viewer
                prov = grant_bigquery_viewer(
                    linked_resource=req["linked_resource"],
                    member_email=req["requester_email"],
                )
                return {"ok": True, "status": "APPROVED", "approvals": approvals, "provisioning": prov}
            except Exception as e:
                # Approved but provisioning failed
                return {"ok": True, "status": "APPROVED", "approvals": approvals, "provisioning": {"ok": False, "error": str(e)}}

        return {"ok": True, "status": "APPROVED", "approvals": approvals}

    return {"ok": True, "status": "PENDING", "approvals": approvals}
