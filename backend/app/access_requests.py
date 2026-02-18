import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

DB_PATH = Path(__file__).resolve().parents[1] / "app.db"

def _connect():
    return sqlite3.connect(DB_PATH)

def init_db():
    con = _connect()
    cur = con.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS access_requests(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_email TEXT NOT NULL,
      linked_resource TEXT NOT NULL,
      access_level TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS approvals(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      approver_email TEXT NOT NULL,
      decision TEXT NOT NULL,
      decided_at TEXT NOT NULL,
      FOREIGN KEY(request_id) REFERENCES access_requests(id)
    )
    """)

    con.commit()
    con.close()

def create_request(requester_email: str, linked_resource: str, access_level: str, reason: str) -> int:
    con = _connect()
    cur = con.cursor()
    cur.execute(
        "INSERT INTO access_requests(requester_email, linked_resource, access_level, reason, status, created_at) VALUES (?,?,?,?,?,?)",
        (requester_email, linked_resource, access_level, reason, "PENDING", datetime.utcnow().isoformat()),
    )
    rid = cur.lastrowid
    con.commit()
    con.close()
    return rid

def list_requests(status: str = "PENDING") -> List[Dict[str, Any]]:
    con = _connect()
    cur = con.cursor()
    cur.execute(
        "SELECT id, requester_email, linked_resource, access_level, reason, status, created_at FROM access_requests WHERE status=? ORDER BY id DESC",
        (status,),
    )
    rows = cur.fetchall()
    con.close()
    return [
        {
            "id": r[0],
            "requester_email": r[1],
            "linked_resource": r[2],
            "access_level": r[3],
            "reason": r[4],
            "status": r[5],
            "created_at": r[6],
        }
        for r in rows
    ]

def get_request(request_id: int) -> Dict[str, Any]:
    con = _connect()
    cur = con.cursor()
    cur.execute(
        "SELECT id, requester_email, linked_resource, access_level, reason, status, created_at FROM access_requests WHERE id=?",
        (request_id,),
    )
    row = cur.fetchone()
    con.close()
    if not row:
        raise KeyError("Request not found")
    return {
        "id": row[0],
        "requester_email": row[1],
        "linked_resource": row[2],
        "access_level": row[3],
        "reason": row[4],
        "status": row[5],
        "created_at": row[6],
    }

def add_approval(request_id: int, role: str, approver_email: str, decision: str):
    con = _connect()
    cur = con.cursor()
    cur.execute(
        "INSERT INTO approvals(request_id, role, approver_email, decision, decided_at) VALUES (?,?,?,?,?)",
        (request_id, role, approver_email, decision, datetime.utcnow().isoformat()),
    )
    con.commit()
    con.close()

def approvals_for_request(request_id: int) -> Dict[str, str]:
    con = _connect()
    cur = con.cursor()
    cur.execute("SELECT role, decision FROM approvals WHERE request_id=?", (request_id,))
    rows = cur.fetchall()
    con.close()
    return {r[0]: r[1] for r in rows}

def set_status(request_id: int, status: str):
    con = _connect()
    cur = con.cursor()
    cur.execute("UPDATE access_requests SET status=? WHERE id=?", (status, request_id))
    con.commit()
    con.close()
