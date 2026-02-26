"""
Auth module
Mock version (GitHub public)

Production:
replace with:
- Google OAuth
- IAP
- Identity Platform
"""

from fastapi import Header, HTTPException

# MOCK USERS
USERS = {
    "viewer@company.com": "VIEWER",
    "steward@company.com": "STEWARD",
    "data.owner@company.com": "DATA_OWNER",
    "admin@company.com": "ADMIN",
}

def get_current_user(x_user_email: str = Header(None)):
    """
    Read user from header

    production:
    read from JWT token
    """

    if not x_user_email:
        raise HTTPException(401, "Missing user")

    role = USERS.get(x_user_email)

    if not role:
        raise HTTPException(403, "User not allowed")

    return {
        "email": x_user_email,
        "role": role
    }

def require_role(user, roles):
    if user["role"] not in roles:
        raise HTTPException(403, "Forbidden")
