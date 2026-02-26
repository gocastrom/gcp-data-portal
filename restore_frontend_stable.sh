#!/bin/bash
set -e

FRONTEND_DIR="frontend"

echo "🔧 Restaurando frontend estable en: $FRONTEND_DIR"

# carpetas base
mkdir -p "$FRONTEND_DIR/src/pages"
mkdir -p "$FRONTEND_DIR/src/components"

# ----------------------------
# src/main.jsx (simple, sin overlay)
# ----------------------------
cat > "$FRONTEND_DIR/src/main.jsx" <<'EOT'
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
EOT

# ----------------------------
# src/index.css (layout como antes: container, header, tabs, row)
# ----------------------------
cat > "$FRONTEND_DIR/src/index.css" <<'EOT'
:root{
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.4;
  color: #111;
  background: #f6f7fb;
}

* { box-sizing: border-box; }
body { margin: 0; }
#root { min-height: 100vh; }

.container{
  max-width: 1060px;
  margin: 0 auto;
  padding: 22px;
}

.header{
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.title{
  font-size: 22px;
  font-weight: 800;
}

.subtitle{
  opacity: 0.7;
  margin-top: 4px;
  font-size: 13px;
}

.headerRight{
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pill{
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef1ff;
  border: 1px solid #dfe4ff;
  font-size: 12px;
  white-space: nowrap;
}

.tabs{
  display: flex;
  gap: 8px;
  margin: 10px 0 16px 0;
  flex-wrap: wrap;
}

.tab{
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 10px;
  background: white;
  border: 1px solid #e6e6ef;
  color: #111;
  font-size: 13px;
}

.tab.active{
  background: #111;
  color: white;
  border-color: #111;
}

.card{
  background: white;
  border: 1px solid #e6e6ef;
  border-radius: 14px;
  padding: 14px;
}

.row{
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

input, select, textarea{
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e6e6ef;
  background: white;
  font-size: 14px;
}

textarea{ min-height: 90px; }

button{
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #111;
  background: #111;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

button.secondary{
  background: white;
  color: #111;
  border-color: #cfd3df;
}

button:disabled{ opacity: 0.5; cursor: not-allowed; }

.error{
  margin-top: 12px;
  background: #fff0f0;
  border: 1px solid #ffd1d1;
  color: #8b1a1a;
  padding: 10px 12px;
  border-radius: 12px;
}

.mono{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

table{
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td{
  padding: 10px 10px;
  border-bottom: 1px solid #eef0f7;
  vertical-align: top;
  font-size: 13px;
}
th{ text-align: left; opacity: 0.8; }
EOT

# ----------------------------
# src/store.js (session + selected asset)
# ----------------------------
cat > "$FRONTEND_DIR/src/store.js" <<'EOT'
const SESSION_KEY = "gcp_portal_session_v1";
const ASSET_KEY = "gcp_portal_asset_v1";

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function setSession(session) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSelectedAsset() {
  try { return JSON.parse(localStorage.getItem(ASSET_KEY) || "null"); }
  catch { return null; }
}

export function setSelectedAsset(asset) {
  if (!asset) localStorage.removeItem(ASSET_KEY);
  else localStorage.setItem(ASSET_KEY, JSON.stringify(asset));
}
EOT

# ----------------------------
# src/api.js (contrato correcto: search -> {items,total})
# ----------------------------
cat > "$FRONTEND_DIR/src/api.js" <<'EOT'
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function http(path, { method = "GET", query, body } = {}) {
  const url = new URL(API_BASE + path);
  if (query) Object.entries(query).forEach(([k, v]) => v != null && url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }

  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  health() { return http("/health"); },

  // backend: /search?q=...&page_size=...
  search(q, { page_size = 25, system, type } = {}) {
    return http("/search", { query: { q, page_size, system, type } });
  },

  // backend: /assets/schema?linked_resource=...
  getSchema(linked_resource) {
    return http("/assets/schema", { query: { linked_resource } });
  },

  // backend: /assets/preview?linked_resource=...&limit=...
  preview(linked_resource, { limit = 10 } = {}) {
    return http("/assets/preview", { query: { linked_resource, limit } });
  },

  // backend: POST /access-requests
  createAccessRequest(payload) {
    return http("/access-requests", { method: "POST", body: payload });
  },

  // backend: GET /access-requests?status=...&approver_email=...
  listAccessRequests({ status, approver_email } = {}) {
    return http("/access-requests", { query: { status, approver_email } });
  },

  // backend: POST /access-requests/{id}/decision
  decideAccessRequest(request_id, { decision, decided_by } = {}) {
    return http(`/access-requests/${encodeURIComponent(request_id)}/decision`, {
      method: "POST",
      body: { decision, decided_by },
    });
  },

  // backend: GET /audit?limit=...
  audit({ limit = 50 } = {}) {
    return http("/audit", { query: { limit } });
  }
};
EOT

# ----------------------------
# components/Badge.jsx
# ----------------------------
cat > "$FRONTEND_DIR/src/components/Badge.jsx" <<'EOT'
export default function Badge({ children }) {
  return <span className="pill">{children}</span>;
}
EOT

# ----------------------------
# components/Table.jsx (igual al que tenías)
# ----------------------------
cat > "$FRONTEND_DIR/src/components/Table.jsx" <<'EOT'
export default function Table({ columns, rows, onRowClick }) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr
            key={idx}
            style={{ cursor: onRowClick ? "pointer" : "default" }}
            onClick={() => onRowClick && onRowClick(r)}
          >
            {columns.map((c) => (
              <td key={c.key}>{r[c.key]}</td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length} style={{ opacity: 0.7 }}>
              No results
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
EOT

# ----------------------------
# src/App.jsx (header + tabs + login)
# ----------------------------
cat > "$FRONTEND_DIR/src/App.jsx" <<'EOT'
import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Search from "./pages/Search.jsx";
import Asset from "./pages/Asset.jsx";
import Approvals from "./pages/Approvals.jsx";
import Audit from "./pages/Audit.jsx";

import { clearSession, getSession } from "./store.js";

function Header({ session, onLogout }) {
  return (
    <div className="header">
      <div>
        <div className="title">GCP Data Portal</div>
        <div className="subtitle">Search · Request · Approve (MVP)</div>
      </div>
      <div className="headerRight">
        <span className="pill">Demo</span>
        <span className="pill">{session?.role || "—"}</span>
        <span className="pill">{session?.email || "—"}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

export default function App() {
  const nav = useNavigate();
  const loc = useLocation();
  const [session, setSessionState] = useState(() => getSession());

  const isAuthed = useMemo(() => !!session?.email, [session]);

  useEffect(() => {
    // si no hay sesión, forzar login
    if (!isAuthed && loc.pathname !== "/login") nav("/login");
    // si hay sesión, evitar login
    if (isAuthed && loc.pathname === "/login") nav("/");
  }, [isAuthed, loc.pathname, nav]);

  function onLoggedIn() {
    setSessionState(getSession());
    nav("/");
  }

  function onLogout() {
    clearSession();
    setSessionState(null);
    nav("/login");
  }

  if (!isAuthed) {
    return (
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login onLoggedIn={onLoggedIn} />} />
          <Route path="*" element={<Login onLoggedIn={onLoggedIn} />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="container">
      <Header session={session} onLogout={onLogout} />

      <div className="tabs">
        <Link className={`tab ${loc.pathname === "/" ? "active" : ""}`} to="/">Search</Link>
        <Link className={`tab ${loc.pathname.startsWith("/approvals") ? "active" : ""}`} to="/approvals">Approvals</Link>
        <Link className={`tab ${loc.pathname.startsWith("/audit") ? "active" : ""}`} to="/audit">Audit</Link>
      </div>

      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/asset" element={<Asset />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="*" element={<Search />} />
      </Routes>
    </div>
  );
}
EOT

# ----------------------------
# pages/Login.jsx (simple, estable)
# ----------------------------
cat > "$FRONTEND_DIR/src/pages/Login.jsx" <<'EOT'
import { useState } from "react";
import { setSession } from "../store.js";

const DEMO_USERS = [
  { email: "viewer@company.com", role: "VIEWER" },
  { email: "requester@company.com", role: "REQUESTER" },
  { email: "data.owner@company.com", role: "DATA_OWNER" },
  { email: "data.steward@company.com", role: "DATA_STEWARD" },
];

export default function Login({ onLoggedIn }) {
  const [sel, setSel] = useState(DEMO_USERS[0].email);

  function doLogin() {
    const u = DEMO_USERS.find(x => x.email === sel) || DEMO_USERS[0];
    setSession({
      email: u.email,
      role: u.role,
      can_request: ["REQUESTER","VIEWER","DATA_OWNER","DATA_STEWARD"].includes(u.role),
      can_approve: u.role === "DATA_OWNER",
    });
    onLoggedIn && onLoggedIn();
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 28 }}>
      <div className="card">
        <div className="title" style={{ fontSize: 18 }}>Login</div>
        <div className="subtitle" style={{ marginBottom: 12 }}>
          Demo login. En producción: Google OAuth / IAP.
        </div>

        <select value={sel} onChange={(e) => setSel(e.target.value)}>
          {DEMO_USERS.map(u => (
            <option key={u.email} value={u.email}>
              {u.email} ({u.role})
            </option>
          ))}
        </select>

        <button onClick={doLogin} style={{ width: "100%" }}>Login</button>
      </div>
    </div>
  );
}
EOT

# ----------------------------
# pages/Search.jsx (tabla como antes + usa data.items)
# ----------------------------
cat > "$FRONTEND_DIR/src/pages/Search.jsx" <<'EOT'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";
import { setSelectedAsset } from "../store.js";

export default function Search() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [system, setSystem] = useState("ANY");
  const [type, setType] = useState("ANY");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  async function runSearch(e) {
    e.preventDefault();
    if (q.trim().length < 2) return;

    setLoading(true);
    setErr("");
    try {
      const data = await api.search(q.trim(), { page_size: 25 });
      let items = data.items || [];

      if (system !== "ANY") items = items.filter((x) => (x.system || x.integrated_system) === system);
      if (type !== "ANY") items = items.filter((x) => String(x.type || "").toUpperCase().includes(type));

      setRows(items);
    } catch (ex) {
      setErr(ex.message || "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: "display_name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "system", label: "System" },
    { key: "linked_resource", label: "Resource" }
  ];

  const tableRows = rows.map((r) => ({
    ...r,
    system: <Badge>{r.system || r.integrated_system || "UNKNOWN"}</Badge>,
    type: <Badge>{String(r.type || "UNKNOWN")}</Badge>,
    linked_resource: <span className="mono">{r.linked_resource}</span>
  }));

  function openAsset(row) {
    const idx = tableRows.indexOf(row);
    const original = rows[idx] || rows[0];
    setSelectedAsset(original);
    nav("/asset");
  }

  return (
    <div>
      <form onSubmit={runSearch} className="row">
        <input
          placeholder='Search assets (e.g. "sales", "customer", "gold")'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
        <select value={system} onChange={(e) => setSystem(e.target.value)} style={{ width: 170 }}>
          <option value="ANY">System: Any</option>
          <option value="BIGQUERY">BIGQUERY</option>
          <option value="DATAPLEX">DATAPLEX</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 150 }}>
          <option value="ANY">Type: Any</option>
          <option value="TABLE">TABLE</option>
          <option value="DATASET">DATASET</option>
          <option value="ENTRY">ENTRY</option>
        </select>
        <button disabled={loading || q.trim().length < 2}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {err && <div className="error">⚠️ {err}</div>}

      <div style={{ marginTop: 14 }}>
        <Table columns={columns} rows={tableRows} onRowClick={openAsset} />
      </div>

      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
        Click a row to open the asset.
      </div>
    </div>
  );
}
EOT

# ----------------------------
# pages/Asset.jsx (schema + preview (si existe) + request access)
# ----------------------------
cat > "$FRONTEND_DIR/src/pages/Asset.jsx" <<'EOT'
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { getSelectedAsset, getSession } from "../store.js";

export default function Asset() {
  const nav = useNavigate();
  const asset = useMemo(() => getSelectedAsset(), []);
  const session = useMemo(() => getSession(), []);

  const [schema, setSchema] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [reason, setReason] = useState("");
  const canRequest = !!session?.can_request;

  useEffect(() => {
    if (!asset) { nav("/"); return; }

    async function load() {
      setLoading(true);
      setErr("");
      try {
        // schema (si existe en backend)
        try {
          const s = await api.getSchema(asset.linked_resource);
          setSchema(s);
        } catch (e) {
          setSchema(null);
        }

        // preview (si existe en backend)
        try {
          const p = await api.preview(asset.linked_resource, { limit: 10 });
          setPreview(p);
        } catch (e) {
          setPreview(null);
        }
      } catch (e) {
        setErr(e.message || "Error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [asset, nav]);

  async function requestAccess(e) {
    e.preventDefault();
    if (!asset?.data_owner) {
      alert("Este asset no tiene data_owner definido (demo).");
      return;
    }
    try {
      await api.createAccessRequest({
        linked_resource: asset.linked_resource,
        requester_email: session.email,
        reason,
        access_level: "READ",
        data_owner: asset.data_owner, // único aprobador
      });
      alert("✅ Solicitud enviada");
      setReason("");
      nav("/approvals");
    } catch (e) {
      alert(`⚠️ ${e.message}`);
    }
  }

  if (!asset) return null;

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="title" style={{ fontSize: 18 }}>{asset.display_name}</div>
          <div className="subtitle">{asset.description || "—"}</div>
          <div style={{ marginTop: 8 }}>
            <span className="pill">{asset.system || "UNKNOWN"}</span>{" "}
            <span className="pill">{asset.type || "UNKNOWN"}</span>
          </div>
        </div>

        <button className="secondary" onClick={() => nav("/")}>← Back</button>
      </div>

      {err && <div className="error">⚠️ {err}</div>}

      <div className="card" style={{ marginTop: 14 }}>
        <div className="title" style={{ fontSize: 14 }}>Resource</div>
        <div className="mono" style={{ marginTop: 6 }}>{asset.linked_resource}</div>
        <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12 }}>
          Owner: {asset.data_owner || "—"} · Steward: {asset.data_steward || "—"}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="title" style={{ fontSize: 14 }}>Schema (si está disponible)</div>
        {loading && <div style={{ opacity: 0.7, marginTop: 8 }}>Loading…</div>}

        {!loading && !schema && (
          <div style={{ opacity: 0.7, marginTop: 8 }}>
            No schema endpoint / schema no disponible (mock).
          </div>
        )}

        {!loading && schema?.columns?.length > 0 && (
          <table>
            <thead>
              <tr><th>Column</th><th>Type</th><th>Description</th></tr>
            </thead>
            <tbody>
              {schema.columns.map((c) => (
                <tr key={c.name}>
                  <td className="mono">{c.name}</td>
                  <td>{c.type || "—"}</td>
                  <td>{c.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="title" style={{ fontSize: 14 }}>Preview (si está disponible)</div>

        {!loading && !preview && (
          <div style={{ opacity: 0.7, marginTop: 8 }}>
            No preview endpoint / preview no disponible (mock).
          </div>
        )}

        {!loading && preview?.rows?.length > 0 && (
          <table>
            <thead>
              <tr>
                {(preview.columns || Object.keys(preview.rows[0] || {})).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((r, i) => (
                <tr key={i}>
                  {(preview.columns || Object.keys(r)).map((k) => (
                    <td key={k} className="mono">{String(r[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {canRequest && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="title" style={{ fontSize: 14 }}>Request access</div>
          <div className="subtitle" style={{ marginTop: 6 }}>
            El único aprobador es el <b>Data Owner</b> definido en el asset.
          </div>

          <form onSubmit={requestAccess} style={{ marginTop: 10 }}>
            <textarea
              placeholder="Business reason…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button disabled={!reason.trim()}>Submit request</button>
          </form>
        </div>
      )}
    </div>
  );
}
EOT

# ----------------------------
# pages/Approvals.jsx (tabs por estado + no se “pierden”)
# ----------------------------
cat > "$FRONTEND_DIR/src/pages/Approvals.jsx" <<'EOT'
import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { getSession } from "../store.js";

export default function Approvals() {
  const session = useMemo(() => getSession(), []);
  const canApprove = session?.can_approve;

  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.listAccessRequests({
        status,
        approver_email: session?.email, // backend filtra por owner
      });
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message || "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  async function decide(id, decision) {
    try {
      await api.decideAccessRequest(id, { decision, decided_by: session?.email });
      await load();
    } catch (e) {
      alert(`⚠️ ${e.message}`);
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="title" style={{ fontSize: 18 }}>Access Requests</div>
          <div className="subtitle">Filtra por estado. No se pierden al aprobar/rechazar.</div>
        </div>

        <div className="row">
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }}>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <button className="secondary" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>

      {err && <div className="error">⚠️ {err}</div>}

      <div style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Requester</th>
              <th>Resource</th>
              <th>Reason</th>
              <th>Status</th>
              {canApprove && status === "PENDING" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.requester_email}</td>
                <td className="mono">{r.linked_resource}</td>
                <td>{r.reason || "—"}</td>
                <td><span className="pill">{r.status}</span></td>
                {canApprove && status === "PENDING" && (
                  <td>
                    <button onClick={() => decide(r.id, "APPROVED")} style={{ marginRight: 8 }}>
                      Approve
                    </button>
                    <button className="secondary" onClick={() => decide(r.id, "REJECTED")}>
                      Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={canApprove && status === "PENDING" ? 5 : 4} style={{ opacity: 0.7 }}>
                  No items for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
EOT

# ----------------------------
# pages/Audit.jsx (real: llama /audit)
# ----------------------------
cat > "$FRONTEND_DIR/src/pages/Audit.jsx" <<'EOT'
import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Audit() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.audit({ limit: 50 });
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message || "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="title" style={{ fontSize: 18 }}>Audit</div>
          <div className="subtitle">Eventos (mock) desde el backend.</div>
        </div>
        <button className="secondary" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {err && <div className="error">⚠️ {err}</div>}

      <div className="card" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>ts</th>
              <th>action</th>
              <th>actor</th>
              <th>resource</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e, i) => (
              <tr key={i}>
                <td className="mono">{e.ts || "—"}</td>
                <td>{e.action || "—"}</td>
                <td className="mono">{e.actor || "—"}</td>
                <td className="mono">{e.linked_resource || "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} style={{ opacity: 0.7 }}>No audit events.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
EOT

echo "✅ Frontend restaurado (formato anterior)."
echo ""
echo "Siguientes pasos:"
echo "  1) cd frontend"
echo "  2) rm -rf node_modules package-lock.json"
echo "  3) npm install"
echo "  4) npm run dev"
