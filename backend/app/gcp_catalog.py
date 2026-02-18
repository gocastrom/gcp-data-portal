import os
from typing import List, Dict, Optional
from google.cloud import datacatalog_v1


def search_catalog(query: str, page_size: int = 20, system: Optional[str] = None) -> List[Dict]:
    """
    Search in GCP Data Catalog (works well for BigQuery tables and other cataloged assets).
    system filter (optional): "BIGQUERY", "GCS", etc. (best-effort)
    """
    project = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    if not project:
        raise ValueError("Missing GOOGLE_CLOUD_PROJECT in environment")

    client = datacatalog_v1.DataCatalogClient()

    scope = datacatalog_v1.types.SearchCatalogRequest.Scope()
    scope.include_project_ids.append(project)

    req = datacatalog_v1.types.SearchCatalogRequest(
        scope=scope,
        query=query,
        page_size=page_size,
    )

    results = client.search_catalog(request=req)

    items = []
    for r in results:
        item = {
            "display_name": r.display_name,
            "description": r.description,
            "linked_resource": r.linked_resource,
            "integrated_system": str(r.integrated_system),
            "type": str(r.search_result_type),
        }
        items.append(item)

    # simple filter if asked
    if system:
        system = system.upper()
        items = [x for x in items if system in (x.get("integrated_system") or "").upper()]

    return items
