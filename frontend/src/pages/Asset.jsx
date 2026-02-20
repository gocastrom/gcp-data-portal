import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import Badge from "../components/Badge.jsx";
import Table from "../components/Table.jsx";
import { getSelectedAsset } from "../store.js";

function isApprover(role) {
  return ["ADMIN", "DATA_OWNER", "DATA_STEWARD", "APPROVER"].includes(String(role || "").toUpperCase());
}

export default function Asset() {
  const nav = useNavigate();
  const asset = getSelectedAsset();

  const role = localStorage.getItem("user_role") || "USER";
  const canEdit = isApprover(role);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [tableDescription, setTableDescription] = useState("");
  const [columns, setColumns] = useState([]); // [{name,type,mode,description}]
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!asset?.linked_resource) return;

    (async () => {
      setLoading(true);
      setErr("");
      setSaveMsg("");
      try {
        const data = await api.getSchema(asset.linked_resource);
        setTableDescription(data.table_description || "");
        setColumns(data.columns || []);
      } catch (e) {
        setErr(e.message || "Error loading catalog schema");
        setColumns([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [asset?.linked_resource]);

  const cols = useMemo(() => {
    const base = [
      { key: "name", label: "Column" },
      { key: "type", label: "Type" },
      { key: "mode", label: "Mode" },
      { key: "description", label: "Description" }
    ];
    return base;
  }, []);

  const rows = useMemo(() => {
    return columns.map((c, idx) => {
      if (!canEdit) return c;

      return {
        ...c,
        description: (
          <input
            value={c.description || ""}
            onChange={(e) => {
              const v = e.target.value;
              setColumns((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], description: v };
                return next;
              });
            }}
            style={{ width: "100%" }}
            placeholder="Describe this column..."
          />
        )
      };
    });
  }, [columns, canEdit]);

  async function saveCatalog() {
    setSaving(true);
    setSaveMsg("");
    setErr("");
    try {
      const payload = {
        linked_resource: asset.linked_resource,
        table_description: tableDescription,
        columns: columns.map((c) => ({ name: c.name, description: c.description || "" }))
      };
      await api.updateSchema(payload);
      setSaveMsg("✅ Guardado. (Esto actualiza BigQuery schema y se refleja en Dataplex/Catalog).");
    } catch (e) {
      setErr(e.message || "Error saving catalog metadata");
    } finally {
      setSaving(false);
    }
  }

  if (!asset) {
    return (
      <div className="card">
        <h2>Sin asset seleccionado</h2>
        <button onClick={() => nav("/")}>Volver</button>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>{asset.display_name || asset.name}</h2>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <Badge>{String(asset.type || "UNKNOWN")}</Badge>
              <Badge>{asset.system || asset.integrated_system || "UNKNOWN"}</Badge>
              <span className="mono" style={{ opacity: 0.8 }}>{asset.linked_resource}</span>
            </div>
            {asset.description && <p style={{ marginTop: 10 }}>{asset.description}</p>}
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {asset.domain && <Badge>Domain: {asset.domain}</Badge>}
              {(asset.data_owner || asset.owner) && <Badge>Owner: {asset.data_owner || asset.owner}</Badge>}
              {(asset.data_steward || asset.steward) && <Badge>Steward: {asset.data_steward || asset.steward}</Badge>}
              {(asset.tags || []).map((t, i) => <Badge key={i}>{t}</Badge>)}
            </div>
          </div>

          <button onClick={() => nav("/")} style={{ height: 40 }}>Back</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ marginBottom: 6 }}>Catalog (Dataplex / BigQuery schema)</h3>
            <div style={{ opacity: 0.75 }}>
              Vista de columnas + descripción del catálogo. {canEdit ? "Puedes editar y guardar." : "Solo lectura."}
            </div>
          </div>

          {canEdit && (
            <button disabled={saving} onClick={saveCatalog} style={{ height: 40 }}>
              {saving ? "Saving..." : "Save to Catalog"}
            </button>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Table description</div>
          {canEdit ? (
            <textarea
              value={tableDescription}
              onChange={(e) => setTableDescription(e.target.value)}
              style={{ width: "100%", minHeight: 80 }}
              placeholder="Describe this table..."
            />
          ) : (
            <div style={{ opacity: 0.9 }}>{tableDescription || "—"}</div>
          )}
        </div>

        {err && <div className="error" style={{ marginTop: 10 }}>⚠️ {err}</div>}
        {saveMsg && <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#eaffea" }}>{saveMsg}</div>}

        <div style={{ marginTop: 14 }}>
          {loading ? (
            <div style={{ opacity: 0.7 }}>Loading catalog schema...</div>
          ) : (
            <Table columns={cols} rows={rows} />
          )}
        </div>
      </div>
    </div>
  );
}
