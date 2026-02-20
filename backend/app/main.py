from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.bq_schema import router as schema_router

# Si ya tienes otros routers, luego los vuelves a agregar aquí.
# (IMPORTANTE: no uses "from ... import router" si el archivo no define router)

app = FastAPI(title="GCP Data Portal API", version="0.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

app.include_router(schema_router)
