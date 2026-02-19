import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/Badge.jsx";
import Table from "../components/Table.jsx";
import { api } from "../api.js";
import { getSelectedAsset } from "../store.js";

export default function Asset() {
  const nav = useNavigate();
  const asset = useMemo(() => getSelectedAsset(), []);

  const [tab, setTab] = useState("overview");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!asset) {
    return (
      <div>
        <p>No asset selected.</p>
        <button className="secondary" onClick={() => nav("/search")}>Back to Search</button>
      </div>
    );
  }

  async function runPreview() {
    setLoading(true);
    setErr("");
    setPreview(null);
    try {
      const res = await api.preview(asset.linked_resource, 10);
      setPreview(res);
      if (res?.ok === false && res.error === "FORBIDDEN") {
        setErr("No access to preview. Request access from the Access tab.");
      }
    } catch (ex) {
      setErr(ex.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  const columns = preview?.ok ? preview.columns.map((c) => ({ key: c, label: c })) : [];
  const rows = preview?.ok
    ? preview.rows.map((r) => {
        const obj = {};
        preview.columns.forEach((c, idx) => (obj[c] = String(r[idx] ?? "")));
        return obj;
      })
    : [];

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>{asset.display_name}</h2>
          <div style={{ opacity: 0.7, marginTop: 4 }}>{asset.description || "No description"}</div>
        </div>
        <div className="row">
          <Badge>{asset.system || asset.integrated_system || "UNKNOWN"}</Badge>
          <Badge>{String(asset.type || "UNKNOWN")}</Badge>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === "overview" ? "tab active" : "tab"} onClick={() => setTab("overview")}>Overview</button>
        <button className={tab === "preview" ? "tab active" : "tab"} onClick={() => setTab("preview")}>Preview</button>
        <button className={tab === "access" ? "tab active" : "tab"} onClick={() => setTab("access")}>Access</button>
      </div>

      {tab === "overview" && (
        <div style={{ marginTop: 12 }}>
          <div className="card">
            <div style={{ opacity: 0.8, marginBottom: 6 }}>Linked resource</div>
            <div className="mono">{asset.linked_resource}</div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="secondary" onClick={() => nav("/search")}>Back</button>
            <button className="secondary" onClick={() => { setTab("preview"); runPreview(); }} disabled={loading}>
              {loading ? "Loading..." : "Open Preview"}
            </button>
            <button onClick={() => nav("/request")}>Request Access</button>
          </div>
        </div>
      )}

      {tab === "preview" && (
        <div style={{ marginTop: 12 }}>
          <div className="row">
            <button className="secondary" onClick={runPreview} disabled={loading}>
              {loading ? "Previewing..." : "Refresh Preview"}
            </button>
            <button className="secondary" onClick={() => setTab("access")}>Go to Access</button>
          </div>

          {err && <div className="error" style={{ marginTop: 12 }}>⚠️ {err}</div>}

          {preview && preview.ok && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Preview (first rows)</div>
              <Table columns={columns} rows={rows} />
            </div>
          )}

          {preview && preview.ok === false && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Preview not available</div>
              <div style={{ opacity: 0.8 }}>Error: <span className="mono">{preview.error}</span></div>
              {preview.message && <div className="mono" style={{ marginTop: 6, opacity: 0.75 }}>{preview.message}</div>}
            </div>
          )}
        </div>
      )}

      {tab === "access" && (
        <div style={{ marginTop: 12 }}>
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Request access</div>
            <div style={{ opacity: 0.8, marginBottom: 10 }}>
              If you don’t have access, submit a request and track approvals.
            </div>
            <button onClick={() => nav("/request")}>Open Request Form</button>
          </div>
        </div>
      )}
    </div>
  );
}
