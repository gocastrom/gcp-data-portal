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
      const data = await api.search(q.trim());
      let items = data.items || [];

      // Normalizar keys para que el front sea compatible con backend mock (name/resource)
      items = items.map((x) => ({
        ...x,
        display_name: x.display_name || x.name || x.asset_name || x.id || "UNKNOWN",
        linked_resource: x.linked_resource || x.resource || x.self_link || x.uri || ""
      }));

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
    display_name: <span style={{ fontWeight: 600 }}>{r.display_name || "UNKNOWN"}</span>,
    system: <Badge>{r.system || r.integrated_system || "UNKNOWN"}</Badge>,
    type: <Badge>{String(r.type || "UNKNOWN")}</Badge>,
    linked_resource: <span className="mono">{r.linked_resource || "-"}</span>
  }));

  function openAsset(asset) {
    setSelectedAsset(asset);
    nav("/asset");
  }

  return (
    <div>
      <form onSubmit={runSearch} className="row" style={{ gap: 10 }}>
        <input
          placeholder='Search assets (e.g. "sales", "customer", "gold")'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={system} onChange={(e) => setSystem(e.target.value)} style={{ width: 160 }}>
          <option value="ANY">System: Any</option>
          <option value="BIGQUERY">BIGQUERY</option>
          <option value="DATAPLEX">DATAPLEX</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 140 }}>
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
        <Table
          columns={columns}
          rows={tableRows}
          onRowClick={(row) => openAsset(rows[tableRows.indexOf(row)])}
        />
      </div>

      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
        Click a row to open the asset.
      </div>
    </div>
  );
}
