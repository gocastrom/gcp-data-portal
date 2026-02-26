from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers (si existen en tu repo)
try:
    from app.gcp_catalog import router as catalog_router
except Exception:
    catalog_router = None

try:
    from app.access_requests import router as access_router
except Exception:
    access_router = None

try:
    from app.assets import router as assets_router
except Exception:
    assets_router = None

try:
    from app.bq_preview import router as preview_router
except Exception:
    preview_router = None

# Audit router (MVP)
from app.audit import router as audit_router

app = FastAPI(title="GCP Data Portal (MVP)", version="0.1.0")

# CORS (MVP local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # producción: fija tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


# Registrar routers disponibles
if catalog_router:
    app.include_router(catalog_router)

if access_router:
    app.include_router(access_router)

if assets_router:
    app.include_router(assets_router)

if preview_router:
    app.include_router(preview_router)

# Siempre incluimos audit (mock)
app.include_router(audit_router)
