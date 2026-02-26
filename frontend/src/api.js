const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function http(path, { method = "GET", query, body, headers } = {}) {
  const url = new URL(API_BASE + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Catalog
  search(q, { page_size = 25, system, type, domain, tags } = {}) {
    return http("/search", { query: { q, page_size, system, type, domain, tags } });
  },
  getSchema(linked_resource) {
    return http("/assets/schema", { query: { linked_resource } });
  },

  // Access Requests
  createAccessRequest(payload) {
    return http("/access-requests", { method: "POST", body: payload });
  },
  listAccessRequests({ status, approver_email } = {}) {
    return http("/access-requests", { query: { status, approver_email } });
  },
  decideAccessRequest(request_id, { decision, decided_by } = {}) {
    return http(`/access-requests/${encodeURIComponent(request_id)}/decision`, {
      method: "POST",
      body: { decision, decided_by },
    });
  },

  // Audit (solo admin en UI; backend puede ser mock)
  audit({ limit = 50 } = {}) {
    return http("/audit", { query: { limit } });
  },
};
