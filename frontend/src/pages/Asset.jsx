import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { getSelectedAsset, getSession, computeAccess } from "../store.js";

export default function Asset() {
  const nav = useNavigate();
  const asset = useMemo(() => getSelectedAsset(), []);
  const session = useMemo(() => getSession(), []);
  const access = useMemo(() => computeAccess({ session, asset }), [session, asset]);

  const [schema, setSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaErr, setSchemaErr] = useState("");

  const [reason, setReason] = useState("Necesito este dataset para análisis/reporting.");
  const [accessLevel, setAccessLevel] = useState("READER");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqErr, setReqErr] = useState("");
  const [reqOk, setReqOk] = useState("");

  useEffect(() => {
    if (!asset) nav("/");
  }, [asset, nav]);

  // Load schema only if user has access
  useEffect(() => {
    if (!asset?.linked_resource) return;
    if (!access?.hasAccess) return;

    let alive = true;

    async function loadSchema() {
      setSchemaLoading(true);
      setSchemaErr("");
      try {
        const data = await api.getSchema(asset.linked_resource);
        if (!alive) return;
        setSchema(data || null);
      } catch (e) {
        if (!alive) return;
        setSchemaErr(e?.message || "Error loading catalog");
        setSchema(null);
      } finally {
        if (!alive) return;
        setSchemaLoading(false);
      }
    }

    loadSchema();
    return () => {
      alive = false;
    };
  }, [asset, access?.hasAccess]);

  async function requestAccess(e) {
    e.preventDefault();
    setReqLoading(true);
    setReqErr("");
    setReqOk("");
    try {
      if (!asset?.data_owner) throw new Error("Asset sin data_owner (mock).");

      await api.createAccessRequest({
        linked_resource: asset.linked_resource,
        requester_email: session?.email,
        access_level: accessLevel,
        reason,
        data_owner: asset.data_owner, // ÚNICO aprobador
      });

      setReqOk("Solicitud enviada. El Data Owner la revisará en Approvals.");
    } catch (e2) {
      setReqErr(e2?.message || "Failed to request access");
    } finally {
      setReqLoading(false);
    }
  }

  if (!asset) return null;

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ cursor: "default" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 950, letterSpacing: -0.6, lineHeight: 1.1 }}>
              {asset.display_name}
            </div>
            <div style={{ marginTop: 10, opacity: 0.85, fontWeight: 600 }}>
              {asset.description || "—"}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="pill">{asset.system || "SYSTEM"}</span>
              <span className="pill">{asset.type || "ASSET"}</span>
              {asset.domain && <span className="pill">{asset.domain}</span>}
              {(asset.tags || []).slice(0, 10).map((t) => (
                <span className="pill" key={t}>{t}</span>
              ))}
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.03 }}>
                  Linked resource
                </div>
                <div style={{ marginTop: 6, fontWeight: 800, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12.5, wordBreak: "break-all" }}>
                  {asset.linked_resource}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.03 }}>
                  Ownership
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="pill">Owner: {asset.data_owner || "—"}</span>
                  <span className="pill">Steward: {asset.data_steward || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="pill">{access?.hasAccess ? "Access: YES" : "Access: NO"}</span>
            <button onClick={() => nav("/")} className="secondary">← Back</button>
          </div>
        </div>
      </div>

      {/* Request access */}
      {!access?.hasAccess && (
        <div className="card" style={{ cursor: "default" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ minWidth: 240 }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>Request access</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                No tienes acceso. Solicita al <b>Data Owner</b> (único aprobador).
              </div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                Reason (mock): {access?.reason}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} style={{ width: 160 }}>
                <option value="READER">READER</option>
                <option value="WRITER">WRITER</option>
              </select>
              <button onClick={requestAccess} disabled={reqLoading || !reason.trim()}>
                {reqLoading ? "Sending..." : "Request access"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
          </div>

          {reqErr && <div className="error">⚠️ {reqErr}</div>}
          {reqOk && <div className="card" style={{ cursor: "default", borderColor: "#bfe8c8" }}>✅ {reqOk}</div>}
        </div>
      )}

      {/* Catalog */}
      <div className="card" style={{ cursor: "default" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Catalog (Dataplex / BigQuery schema)</div>
            <div style={{ marginTop: 6, opacity: 0.8 }}>
              Vista de columnas + descripción (mock). En producción viene de Dataplex Catalog.
            </div>
          </div>
          {access?.hasAccess && <div className="pill">Read-only (MVP)</div>}
        </div>

        {!access?.hasAccess && (
          <div style={{ marginTop: 10, opacity: 0.8 }}>
            Bloqueado: solicita acceso para ver columnas.
          </div>
        )}

        {access?.hasAccess && (
          <>
            {schemaLoading && <div style={{ marginTop: 12, opacity: 0.8 }}>Loading catalog…</div>}
            {schemaErr && <div className="error" style={{ marginTop: 12 }}>⚠️ {schemaErr}</div>}

            {!schemaLoading && !schemaErr && (
              <>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.03 }}>
                    Table description
                  </div>
                  <div style={{ marginTop: 6, fontWeight: 700 }}>
                    {schema?.table_description || "—"}
                  </div>
                </div>

                <div style={{ marginTop: 12 }} className="tableWrap">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 220 }}>Column</th>
                        <th style={{ width: 140 }}>Type</th>
                        <th style={{ width: 140 }}>Mode</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(schema?.columns || []).map((c, i) => (
                        <tr key={`${c.name}-${i}`}>
                          <td className="mono">{c.name}</td>
                          <td>{c.type || "—"}</td>
                          <td>{c.mode || "—"}</td>
                          <td>{c.description || "—"}</td>
                        </tr>
                      ))}
                      {(!schema?.columns || schema.columns.length === 0) && (
                        <tr>
                          <td colSpan={4} style={{ opacity: 0.7 }}>No schema columns.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
