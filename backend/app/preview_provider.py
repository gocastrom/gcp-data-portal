import os
from typing import Dict, Any
from app.bq_preview import preview_table

def _mock_preview(_linked_resource: str, limit: int = 10) -> Dict[str, Any]:
    cols = ["date", "store_id", "sku", "sales_qty", "promo_flag"]
    rows = []
    for i in range(limit):
        rows.append([f"2026-02-{(i%28)+1:02d}", 100+i, f"SKU-{1000+i}", 10+(i%7), int(i%2==0)])
    return {"ok": True, "columns": cols, "rows": rows, "mode": "mock"}

def preview(linked_resource: str, limit: int = 10) -> Dict[str, Any]:
    provider = os.getenv("PREVIEW_PROVIDER", "mock").lower()
    if provider == "mock":
        return _mock_preview(linked_resource, limit)
    if provider == "bigquery":
        return preview_table(linked_resource, limit)
    return {"ok": False, "error": f"Unsupported PREVIEW_PROVIDER={provider}"}
