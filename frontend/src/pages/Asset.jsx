import { useState } from "react";
import { api } from "../api.js";
import Badge from "../components/Badge.jsx";
import Table from "../components/Table.jsx";

export default function Asset({ asset, onBack, onRequest }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!asset) {
    return (
      <div>
        <p>No asset selected.</p>
        <button className="secondary" onClick={onBack}>Back</button>
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

      // If forbidden, guide user to request access
      if (res && res.ok === false && res.error === "FORBIDDEN") {
        setErr("You do not have access to preview this asset. Request access below.");
      }
    } catch (ex) {
      setErr(ex.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  const columns = preview?.ok
    ? preview.columns.map((c) => ({ key: c, label: c }))
    : [];

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
        <h2 style={{ margin: 0 }}>{asset.display_name}</h2>
        <div className="row">
          <Badge>{asset.system || asset.integrated_system}</Badge>
          <Badge>{asset.type}</Badge>
        </div>
      </div>

      <p style={{ opacity: 0.8 }}>{asset.description || "No description"}</p>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ opacity: 0.8, marginBottom: 6 }}>Linked resource</div>
        <div className="mono">{asset.linked_resource}</div>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="secondary" onClick={onBack}>Back</button>
        <button className="secondary" onClick={runPreview} disabled={loading}>
          {loading ? "Previewing..." : "Preview"}
        </button>
        <button onClick={onRequest}>Request Access</button>
      </div>

      {err && <div className="error" style={{ marginTop: 12 }}>⚠️ {err}</div>}

      {preview && (
        <div style={{ marginTop: 12 }}>
          {preview.ok ? (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Preview (first rows)</div>
              <Table columns={columns} rows={rows} />
            </div>
          ) : (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Preview not available</div>
              <div style={{ opacity: 0.8 }}>
                Error: <span className="mono">{preview.error}</span>
              </div>
              {preview.message && (
                <div style={{ marginTop: 6, opacity: 0.75 }} className="mono">
                  {preview.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
