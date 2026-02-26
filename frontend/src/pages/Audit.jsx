import { useEffect, useState } from "react";
import { api } from "../api.js";
import { getSession } from "../store.js";

export default function Audit() {
  const session = getSession();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // Si tu backend todavía no expone /audit, esto mostrará el error.
      const data = await api.audit({ limit: 50 });
      setRows(data?.items || []);
    } catch (e) {
      setRows([]);
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2 style={{ margin: 0 }}>Audit</h2>
      <div style={{ opacity: 0.75, marginTop: 6 }}>
        Solo visible para <b>ADMIN</b>. (En producción: auditoría real + storage seguro.)
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && <div className="error" style={{ marginTop: 12 }}>⚠️ {err}</div>}

      <div style={{ marginTop: 12 }}>
        {rows.length === 0 && !err ? (
          <div style={{ opacity: 0.7 }}>No audit rows.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.ts || r.time || r.created_at || "-"}</td>
                  <td>{r.actor || r.user || "-"}</td>
                  <td>{r.action || r.event || "-"}</td>
                  <td className="mono">{r.linked_resource || r.resource || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
