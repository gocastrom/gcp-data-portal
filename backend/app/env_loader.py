import os

def load_env_from_string():
    """
    If ENV_FILE contains lines KEY=VALUE, load them into process env.
    This keeps repo public: no .env committed.
    """
    raw = os.getenv("ENV_FILE", "")
    if not raw.strip():
        return

    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v
