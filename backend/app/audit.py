from fastapi import APIRouter, Query
from typing import Any, Dict, List
from datetime import datetime, timezone

router = APIRouter(tags=["audit"])

# In-memory mock audit log (MVP)
# En producción: escribir en BigQuery / Cloud Logging / PubSub + sink / Firestore
_AUDIT: List[Dict[str, Any]] = [
    {
        "ts": datetime.now(timezone.utc).isoformat(),
        "actor": "system",
        "action": "BOOT",
        "resource": "-",
        "details": {"message": "Audit mock initialized"},
    }
]


def audit_log(actor: str, action: str, resource: str, details: Dict[str, Any] = None) -> None:
    _AUDIT.insert(
        0,
        {
            "ts": datetime.now(timezone.utc).isoformat(),
            "actor": actor,
            "action": action,
            "resource": resource,
            "details": details or {},
        },
    )
    # Limitar tamaño en memoria
    if len(_AUDIT) > 5000:
        del _AUDIT[5000:]


@router.get("/audit")
def list_audit(limit: int = Query(50, ge=1, le=500)) -> Dict[str, Any]:
    """
    MVP: retorna log en memoria.
    Producción: filtrar por actor, resource, rango fechas y paginar.
    """
    return {"items": _AUDIT[:limit], "total": len(_AUDIT)}
