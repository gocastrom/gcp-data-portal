import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { setSelectedAsset } from "../store.js";

const SYSTEMS = ["", "BIGQUERY", "DATAPLEX"];
const TYPES = ["", "TABLE", "ENTRY"];
const DOMAINS = ["", "Retail", "Logistics", "CRM", "Ecommerce"];

export default function Search() {
  const nav = useNavigate();

  const [q, setQ] = useState("sales");
  const [system, setSystem] = useState("");
  const [type, setType] = useState("");
  const [domain, setDomain] = useState("");
  const [tags, setTags] = useState(""); // comma-separated

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const effectiveQuery = useMemo(() => q.trim(), [q]);

  async function runSearch(e) {
    e?.preventDefault?.();
    setLoading(true);
    setErr("");
    setResults([]);
    try {
      const data = await api.search(effectiveQuery, {
        page_size: 20,
        system: system || undefined,
        type: type || undefined,
      });

      // backend now supports domain/tags; if your api.js doesn't pass them, we filter here as fallback:
      let items = data?.items || [];

      if (domain) items = items.filter((x) => (x.domain || "") === domain);
      if (tags.trim()) {
        const tfs = tags.split(",").map((s) => s.trim()).filter(Boolean);
        items = items.filter((x) => tfs.every((t) => (x.tags || []).includes(t)));
      }

      setResults(items);
    } catch (e2) {
      setErr(e2?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  function openAsset(asset) {
    setSelectedAsset(asset);
    nav("/asset");
  }

  return (
    <div>
      <div className="card">
        <form onSubmit={runSearch} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <input
                type="search"
                placeholder="Search assets (sales, inventory, crm, orders...)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading || !effectiveQuery}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, marginBottom: 6 }}>System</div>
              <select value={system} onChange={(e) => setSystem(e.target.value)}>
                {SYSTEMS.map((s) => (
                  <option key={s} value={s}>{s || "All"}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, marginBottom: 6 }}>Type</div>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t || "All"}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, marginBottom: 6 }}>Domain</div>
              <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>{d || "All"}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, marginBottom: 6 }}>Tags (comma)</div>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="gold,kpi" />
            </div>
          </div>
        </form>

        {err && <div className="error" style={{ marginTop: 12 }}>⚠️ {err}</div>}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {results.map((r) => (
          <div key={r.linked_resource} className="card" onClick={() => openAsset(r)} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{r.display_name}</div>
                <div style={{ marginTop: 6, opacity: 0.82 }}>{r.description}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="pill">{r.system}</span>
                  <span className="pill">{r.type}</span>
                  {r.domain && <span className="pill">{r.domain}</span>}
                  {(r.tags || []).slice(0, 8).map((t) => (
                    <span className="pill" key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="pill" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {String(r.linked_resource).replace("bigquery://", "bq://").replace("dataplex://", "dlp://")}
              </div>
            </div>
          </div>
        ))}

        {!loading && results.length === 0 && (
          <div className="card">
            <div style={{ opacity: 0.7, fontWeight: 700 }}>No results</div>
          </div>
        )}
      </div>
    </div>
  );
}
