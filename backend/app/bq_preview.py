import re
from typing import Dict, Any, List

from google.cloud import bigquery
from google.api_core.exceptions import Forbidden, NotFound


BQ_LINK_RE = re.compile(
    r"//bigquery\.googleapis\.com/projects/(?P<project>[^/]+)/datasets/(?P<dataset>[^/]+)/tables/(?P<table>[^/]+)"
)

def parse_bq_linked_resource(linked_resource: str):
    m = BQ_LINK_RE.match(linked_resource or "")
    if not m:
        return None
    return m.group("project"), m.group("dataset"), m.group("table")

def preview_table(linked_resource: str, limit: int = 10) -> Dict[str, Any]:
    parsed = parse_bq_linked_resource(linked_resource)
    if not parsed:
        return {"ok": False, "error": "Unsupported linked_resource for BigQuery preview"}

    project, dataset, table = parsed
    client = bigquery.Client(project=project)

    sql = f"SELECT * FROM `{project}.{dataset}.{table}` LIMIT {int(limit)}"
    try:
        rows = client.query(sql).result()
        cols = [f.name for f in rows.schema]
        data: List[List[Any]] = []
        for r in rows:
            data.append([r.get(c) for c in cols])
        return {"ok": True, "columns": cols, "rows": data}

    except Forbidden as e:
        # user/service account doesn't have access
        return {"ok": False, "error": "FORBIDDEN", "message": str(e)}

    except NotFound as e:
        return {"ok": False, "error": "NOT_FOUND", "message": str(e)}
