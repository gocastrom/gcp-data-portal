from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query

from app.mock_catalog import MOCK_ASSETS, MOCK_SCHEMAS

router = APIRouter(tags=["catalog"])

def _norm(s: str) -> str:
    return (s or "").strip().lower()

def _tokenize(q: str) -> List[str]:
    q = _norm(q)
    if not q:
        return []
    return [t for t in q.replace(",", " ").split() if t]

def _score(asset: Dict[str, Any], tokens: List[str]) -> float:
    """
    Simple ranking:
      - exact display_name match: +100
      - display_name contains token: +20 each
      - domain contains token: +8 each
      - description contains token: +6 each
      - tags contains token: +10 each
      - system/type match tokens: +4 each
    """
    if not tokens:
        return 0.0

    dn = _norm(asset.get("display_name", ""))
    desc = _norm(asset.get("description", ""))
    domain = _norm(asset.get("domain", ""))
    tags = [_norm(t) for t in (asset.get("tags") or [])]
    sys = _norm(asset.get("system", ""))
    typ = _norm(asset.get("type", ""))

    score = 0.0

    joined_tags = " ".join(tags)
    for t in tokens:
        if not t:
            continue
        if dn == t:
            score += 100
        if t in dn:
            score += 20
        if t in domain:
            score += 8
        if t in desc:
            score += 6
        if t in joined_tags:
            score += 10
        if t in sys:
            score += 4
        if t in typ:
            score += 4

    # bonus if all tokens appear somewhere
    hay = " ".join([dn, domain, desc, joined_tags, sys, typ])
    if all(t in hay for t in tokens):
        score += 12

    return score

@router.get("/search")
def search(
    q: Optional[str] = Query(default="", description="Search text"),
    page_size: int = Query(default=25, ge=1, le=200),
    system: Optional[str] = Query(default=None),
    type: Optional[str] = Query(default=None),
    domain: Optional[str] = Query(default=None),
    tags: Optional[str] = Query(default=None, description="Comma-separated tags filter, e.g. gold,kpi"),
):
    """
    MVP MOCK SEARCH (ranked + filters).
    Production replacement:
      - Dataplex Catalog search + facets
      - Data Catalog tags / policy tags
      - Owners/Stewards from governance sources
    """
    tokens = _tokenize(q or "")
    sys_f = _norm(system) if system else None
    type_f = _norm(type) if type else None
    domain_f = _norm(domain) if domain else None

    tag_filters = []
    if tags:
        tag_filters = [t for t in _tokenize(tags) if t]

    scored = []
    for a in MOCK_ASSETS:
        a_sys = _norm(a.get("system", ""))
        a_type = _norm(a.get("type", ""))
        a_domain = _norm(a.get("domain", ""))
        a_tags = [_norm(t) for t in (a.get("tags") or [])]

        if sys_f and a_sys != sys_f:
            continue
        if type_f and a_type != type_f:
            continue
        if domain_f and a_domain != domain_f:
            continue
        if tag_filters and not all(tf in a_tags for tf in tag_filters):
            continue

        # if q exists, require at least one token match somewhere
        if tokens:
            hay = " ".join([
                _norm(a.get("display_name", "")),
                _norm(a.get("description", "")),
                _norm(a.get("domain", "")),
                " ".join(a_tags),
                a_sys,
                a_type,
            ])
            if not any(t in hay for t in tokens):
                continue

        s = _score(a, tokens)
        scored.append((s, a))

    # sort best first, stable by display_name
    scored.sort(key=lambda x: (-x[0], _norm(x[1].get("display_name", ""))))
    items = [a for _, a in scored]

    return {"items": items[:page_size], "total": len(items)}

@router.get("/assets/schema")
def get_schema(linked_resource: str = Query(..., description="bigquery://... or dataplex://...")):
    """
    MVP MOCK SCHEMA.
    Returns empty schema instead of 404 to keep UI stable.
    """
    data = MOCK_SCHEMAS.get(linked_resource)
    if not data:
        return {"table_description": "—", "columns": []}
    return data
