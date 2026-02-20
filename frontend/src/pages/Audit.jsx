import { useEffect, useState } from "react";
import { api } from "../api.js";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";

export default function Audit() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const data = await api.audit(200);
        const items = data.items || [];

        const tableRows = items.map((e) => ({
          ...e,
          action: <Badge>{e.action || "UNKNOWN"}</Badge>,
          actor_email: <span className="mono">{e.actor_email || "-"}</span>,
          entity_type: <Badge>{e.entity_type || "-"}</Badge>,
          entity_id: <span className="mono">{e.entity_id || "-"}</span>,
        }));

        setRows(tableRows);
      } catch (ex) {
        setErr(ex.message || "Error");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns = [
    { key: "ts", label: "Time" },
    { key: "action", label: "Action" },
    { key: "actor_email", label: "Actor" },
    { key: "entity_type", label: "Entity" },
    { key: "entity_id", label: "ID" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Audit</h2>
        <button onClick={() => window.location.reload()} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && <div className="error" style={{ marginTop: 10 }}>⚠️ {err}</div>}

      <div style={{ marginTop: 14 }}>
        <Table columns={columns} rows={rows} />
      </div>

      {!loading && rows.length === 0 && !err && (
        <div style={{ marginTop: 10, opacity: 0.7 }}>
          No events yet. Go to Search and perform an action.
        </div>
      )}
    </div>
  );
}
