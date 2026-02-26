import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { addGrant, revokeGrant, getSession } from "../store.js";

export default function Approvals() {
  const session = useMemo(() => getSession(), []);
  const isOwner = session?.role === "DATA_OWNER";
  const isSteward = session?.role === "DATA_STEWARD";
  const isAdmin = session?.role === "ADMIN";
  const canView = isOwner || isSteward || isAdmin;

  const [status, setStatus] = useState("PENDING");
  const [approverEmail, setApproverEmail] = useState(session?.email || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    if (!canView) return;
    setLoading(true);
    setErr("");
    try {
      const data = await api.listAccessRequests({
        status,
        approver_email: approverEmail || session?.email,
      });
      setRows(data?.items || []);
    } catch (e) {
      setErr(e?.message || "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, approverEmail]); // eslint-disable-line

  async function decide(req, decision) {
    if (!isOwner && !isAdmin) {
      alert("Solo el DATA_OWNER (o ADMIN) puede aprobar/rechazar en este MVP.");
      return;
    }
    try {
      await api.decideAccessRequest(req.id, { decision, decided_by: session?.email });

      // MVP mock grant
      if (decision === "APPROVED") addGrant(req.requester_email, req.linked_resource, { approved_by: session?.email });
      if (decision === "REJECTED") revokeGrant(req.requester_email, req.linked_resource);

      await load();
    } catch (e) {
      alert(`Error: ${e?.message || "Error"}`);
    }
  }

  if (!canView) {
    return (
      <div className="card">
        <h2>Approvals</h2>
        <p>Tu rol no tiene acceso a este módulo.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>Approvals</div>
          <div style={{ marginTop: 6, opacity: 0.75 }}>
            Owner y Steward pueden ver. Solo el <b>Owner</b> aprueba/rechaza (MVP).
          </div>
        </div>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 200 }}>
          <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, marginBottom: 6 }}>View status</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, marginBottom: 6 }}>Approver email (owner)</div>
          <input value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} />
        </div>
      </div>

      {err && <div className="error" style={{ marginTop: 12 }}>⚠️ {err}</div>}

      <div style={{ marginTop: 14 }} className="tableWrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 220 }}>ID</th>
              <th>Resource</th>
              <th style={{ width: 220 }}>Requester</th>
              <th style={{ width: 120 }}>Access</th>
              <th style={{ width: 120 }}>Status</th>
              <th style={{ width: 220 }}>Created</th>
              <th style={{ width: 220, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const canDecide = (isOwner || isAdmin) && r.status === "PENDING";
              return (
                <tr key={r.id}>
                  <td className="mono">{String(r.id).slice(0, 8)}…{String(r.id).slice(-6)}</td>
                  <td className="mono" style={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.linked_resource}
                  </td>
                  <td>{r.requester_email}</td>
                  <td>{r.access_level || "READER"}</td>
                  <td><span className="badge">{r.status}</span></td>
                  <td style={{ fontSize: 12, opacity: 0.85 }}>{r.created_at || r.created || "—"}</td>
                  <td>
                    <div className="actions">
                      <button disabled={!canDecide} onClick={() => decide(r, "APPROVED")}>Approve</button>
                      <button className="secondary" disabled={!canDecide} onClick={() => decide(r, "REJECTED")}>Reject</button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ opacity: 0.7 }}>No requests in this status.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
        Tip MVP: si “Approve”, el requester obtiene acceso mock (grant local) y ya puede ver el catálogo del asset.
      </div>
    </div>
  );
}
