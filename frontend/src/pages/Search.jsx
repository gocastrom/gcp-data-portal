import { useState } from "react";
import { api } from "../api.js";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";

export default function Search({ onSelect }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  async function runSearch(e) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setLoading(true);
    setErr("");
    try {
      const data = await api.search(q.trim());
      setRows(data.items || []);
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
    { key: "integrated_system", label: "System" },
    { key: "linked_resource", label: "Resource" }
  ];

  const tableRows = rows.map((r) => ({
    ...r,
    integrated_system: <Badge>{r.integrated_system}</Badge>,
    type: <Badge>{r.type}</Badge>,
    linked_resource: <span className="mono">{r.linked_resource}</span>
  }));

  return (
    <div>
      <form onSubmit={runSearch} className="row">
        <input
          placeholder='Search assets (e.g. "sales", "customer", "gold")'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button disabled={loading || q.trim().length < 2}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {err && <div className="error">⚠️ {err}</div>}

      <div style={{ marginTop: 14 }}>
        <Table
          columns={columns}
          rows={tableRows}
          onRowClick={(row) => onSelect(rows[tableRows.indexOf(row)])}
        />
      </div>

      <p style={{ opacity: 0.7, marginTop: 12 }}>
        Tip: This MVP uses mock search results until GCP integration is enabled.
      </p>
    </div>
  );
}
