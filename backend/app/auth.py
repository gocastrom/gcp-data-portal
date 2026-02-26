"""
Mock Auth (public repo safe)

Frontend sends header: X-User-Email
We map email -> role.

Production replacement:
- Cloud Run + IAP: read IAP headers
- OAuth/JWT: verify token, extract email/groups
"""

from fastapi import Header, HTTPException

USERS = {
    "viewer@company.com": "VIEWER",
    "steward@company.com": "STEWARD",
    "data.owner@company.com": "DATA_OWNER",
    "admin@company.com": "ADMIN",
}

def get_current_user(x_user_email: str = Header(None)):
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Missing X-User-Email header")

    role = USERS.get(x_user_email)
    if not role:
        raise HTTPException(status_code=403, detail="User not allowed (unknown email)")

    return {"email": x_user_email, "role": role}

def require_role(user: dict, allowed_roles: list):
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail=f"Forbidden for role={user['role']}")
