const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// MVP: usuario mock desde UI
function defaultHeaders() {
  const email = localStorage.getItem("user_email") || "user@company.com";
  const role = localStorage.getItem("user_role") || "USER";
  const mock = localStorage.getItem("mock_mode") || "1"; // 1=sin GCP, 0=con GCP
  return {
    "X-User-Email": email,
    "X-User-Role": role,
    "X-Mock": mock
  };
}

async function fetchJson(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...defaultHeaders(),
      ...(opts.headers || {})
    }
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message)) ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // Catalog schema (Dataplex/BigQuery metadata)
  getSchema: (linked_resource) => {
    const params = new URLSearchParams({ linked_resource });
    return fetchJson(`/assets/schema?${params.toString()}`, { method: "GET" });
  },

  updateSchema: (payload) => {
    return fetchJson(`/assets/schema`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }
};
