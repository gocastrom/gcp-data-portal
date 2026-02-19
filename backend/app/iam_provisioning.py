import re
from typing import Dict, Any

from google.cloud import bigquery

BQ_LINK_RE = re.compile(
    r"//bigquery\.googleapis\.com/projects/(?P<project>[^/]+)/datasets/(?P<dataset>[^/]+)/tables/(?P<table>[^/]+)"
)

def parse_bq_linked_resource(linked_resource: str):
    m = BQ_LINK_RE.match(linked_resource or "")
    if not m:
        return None
    return m.group("project"), m.group("dataset"), m.group("table")

def grant_bigquery_viewer(linked_resource: str, member_email: str) -> Dict[str, Any]:
    """
    Grants dataset-level BigQuery Data Viewer to user: user:email
    This is an MVP approach for public repo.
    """
    parsed = parse_bq_linked_resource(linked_resource)
    if not parsed:
        return {"ok": False, "error": "Unsupported linked_resource"}

    project, dataset, _table = parsed
    client = bigquery.Client(project=project)

    ds_id = f"{project}.{dataset}"
    ds = client.get_dataset(ds_id)

    entries = list(ds.access_entries)
    member = f"user:{member_email}"

    # add dataset-level viewer
    entries.append(bigquery.AccessEntry(role="READER", entity_type="userByEmail", entity_id=member_email))
    ds.access_entries = entries
    client.update_dataset(ds, ["access_entries"])

    return {"ok": True, "granted": "DATASET_READER", "dataset": ds_id, "member": member}
