import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Cargar backend/.env siempre, independiente del cwd
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)

from app.gcp_catalog import search_catalog  # noqa: E402

app = FastAPI(title="GCP Data Portal API", version="0.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "ok": True,
        "project": os.getenv("GOOGLE_CLOUD_PROJECT", ""),
        "has_credentials_env": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")),
    }

@app.get("/search")
def search(
    q: str = Query(..., min_length=2),
    page_size: int = Query(20, ge=1, le=100),
    system: Optional[str] = Query(None, description="Optional: BIGQUERY, GCS, etc."),
):
    items = search_catalog(query=q, page_size=page_size, system=system)
    return {"query": q, "count": len(items), "items": items}
