import os
from typing import Dict, List, Optional

# Provider interface: returns a list of "assets"
# Asset format (normalized):
# {
#   "display_name": str,
#   "description": str,
#   "linked_resource": str,   # e.g. BigQuery resource
#   "system": str,            # BIGQUERY, GCS, etc.
#   "type": str               # TABLE, DATASET, FILE, ...
# }

def _mock_search(q: str, page_size: int) -> List[Dict]:
    items = [
        {
            "display_name": "sales_daily_gold",
            "description": "Daily sales aggregated per store and SKU",
            "linked_resource": "//bigquery.googleapis.com/projects/your-gcp-project-id/datasets/gold/tables/sales_daily",
            "system": "BIGQUERY",
            "type": "TABLE",
        },
        {
            "display_name": "customer_master",
            "description": "Customer master dataset",
            "linked_resource": "//bigquery.googleapis.com/projects/your-gcp-project-id/datasets/mdm/tables/customer_master",
            "system": "BIGQUERY",
            "type": "TABLE",
        },
    ]
    return items[:page_size]


def _dataplex_search(project_id: str, query: str, page_size: int) -> List[Dict]:
    # Dataplex Universal Catalog search sample uses:
    # name=f"projects/{project_id}/locations/global"
    # scope=f"projects/{project_id}"
    # query="MY_QUERY"
    # Ref: Google samples/docs. :contentReference[oaicite:1]{index=1}

    from google.cloud import dataplex_v1

    with dataplex_v1.CatalogServiceClient() as client:
        req = dataplex_v1.SearchEntriesRequest(
            page_size=page_size,
            name=f"projects/{project_id}/locations/global",
            scope=f"projects/{project_id}",
            query=query,
        )
        resp = client.search_entries(req)

        # resp is iterable (paged); results contain dataplex_entry
        items: List[Dict] = []
        for r in resp:
            e = r.dataplex_entry
            # best-effort normalization
            display_name = getattr(e, "display_name", "") or (e.name.split("/")[-1] if e.name else "entry")
            desc = getattr(e, "description", "") or ""
            linked = getattr(e, "linked_resource", "") or ""
            etype = getattr(e, "entry_type", "") or "ENTRY"
            system = "DATAPLEX"

            # If linked resource looks like BigQuery, label it
            if "bigquery" in linked.lower():
                system = "BIGQUERY"

            items.append(
                {
                    "display_name": display_name,
                    "description": desc,
                    "linked_resource": linked or e.name,
                    "system": system,
                    "type": etype,
                }
            )
        return items


def search_assets(q: str, page_size: int = 20) -> List[Dict]:
    provider = os.getenv("CATALOG_PROVIDER", "mock").lower()
    project = os.getenv("GOOGLE_CLOUD_PROJECT", "your-gcp-project-id")

    if provider == "mock":
        return _mock_search(q, page_size)

    if provider == "dataplex":
        return _dataplex_search(project, q, page_size)

    raise ValueError("Unsupported CATALOG_PROVIDER. Use: mock | dataplex")
