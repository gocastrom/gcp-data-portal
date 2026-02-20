from __future__ import annotations

import os
from fastapi import APIRouter, Query

router = APIRouter()

def _is_mock() -> bool:
    return os.getenv("MOCK_MODE", "true").lower() in ("1", "true", "yes", "y")

@router.get("/assets/preview")
def preview_asset(
    linked_resource: str = Query(..., description="e.g. bigquery://project.dataset.table"),
    limit: int = Query(10, ge=1, le=100),
):
    """
    MVP:
    - En MOCK_MODE=true: retorna filas dummy.
    - En producción: aquí iría BigQuery client + SELECT * LIMIT N (con controles).
    """
    if _is_mock():
        rows = []
        for i in range(1, limit + 1):
            rows.append({"row": i, "example_col_1": "value", "example_col_2": (i - 1) * 10})
        return {"ok": True, "mode": "mock", "linked_resource": linked_resource, "rows": rows}

    # Placeholder modo real (sin conectar GCP todavía)
    return {
        "ok": True,
        "mode": "real_not_implemented",
        "linked_resource": linked_resource,
        "rows": [],
        "message": "Preview real no implementado en este MVP. Usa MOCK_MODE=true.",
    }
