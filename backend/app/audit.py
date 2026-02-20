import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).resolve().parents[1] / "app.db"

def init_audit_db():
    with sqlite3.connect(DB_PATH) as con:
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              ts_utc TEXT NOT NULL,
              actor_email TEXT,
              actor_role TEXT,
              action TEXT NOT NULL,
              entity_type TEXT,
              entity_id TEXT,
              metadata_json TEXT
            );
            """
        )
        con.execute("CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts_utc);")
        con.execute("CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);")
        con.commit()

def log_event(
    action: str,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    ts = datetime.now(timezone.utc).isoformat()
    payload = json.dumps(metadata or {}, ensure_ascii=False)

    with sqlite3.connect(DB_PATH) as con:
        con.execute(
            """
            INSERT INTO audit_events
            (ts_utc, actor_email, actor_role, action, entity_type, entity_id, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (ts, actor_email, actor_role, action, entity_type, entity_id, payload),
        )
        con.commit()

def list_events(limit: int = 200, action: Optional[str] = None) -> List[Dict[str, Any]]:
    q = "SELECT id, ts_utc, actor_email, actor_role, action, entity_type, entity_id, metadata_json FROM audit_events"
    params: List[Any] = []
    if action:
        q += " WHERE action = ?"
        params.append(action)
    q += " ORDER BY id DESC LIMIT ?"
    params.append(int(limit))

    with sqlite3.connect(DB_PATH) as con:
        cur = con.execute(q, params)
        rows = cur.fetchall()

    out: List[Dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "id": r[0],
                "ts_utc": r[1],
                "actor_email": r[2],
                "actor_role": r[3],
                "action": r[4],
                "entity_type": r[5],
                "entity_id": r[6],
                "metadata": json.loads(r[7] or "{}"),
            }
        )
    return out
