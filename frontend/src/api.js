const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function httpGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

async function httpPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

export const api = {
  search: (q) => httpGet(`/search?q=${encodeURIComponent(q)}&page_size=25`),
  createRequest: (payload) => httpPost(`/access-requests`, payload),
  listRequests: (status = "PENDING") => httpGet(`/access-requests?status=${encodeURIComponent(status)}`),
  getRequest: (id) => httpGet(`/access-requests/${id}`),
  approve: (id, payload) => httpPost(`/access-requests/${id}/approve`, payload)
};
