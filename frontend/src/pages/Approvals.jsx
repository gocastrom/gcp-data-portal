import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import Table from "../components/Table.jsx";
import Badge from "../components/Badge.jsx";

export default function Approvals() {
  const [status, setStatus] = useState("PENDING");
  const [role, setRole] = useState("DATA_OWNER");
  const [approverEmail, setApproverEmail] = useState("approver@company.com");
  const [decisionNote, setDecisionNote] = useState("Aprobado para uso analítico.");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.listAccessRequests({
        status,
        approver_role: role,
        approver_email: approverEmail,
      });
      setRows(data.items || []);
    } catch (ex) {
      setErr(ex?.message || "Error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(id) {
    setLoading(true);
    setErr("");
    try {
      await api.approveAccessRequest(id, {
        approver_role: role,
        approver_email: approverEmail,
        note: decisionNote || "Approved",
      });
      await load();
    } catch (ex) {
      setErr(ex?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function reject(id) {
    setLoading(true);
    setErr("");
    try {
      await api.rejectAccessRequest(id, {
        approver_role: role,
        approver_email: approverEmail,
        note: decisionNote || "Rejected",
      });
      await load();
    } catch (ex) {
      setErr(ex?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "linked_resource", label: "Resource" },
      { key: "requester_email", label: "Requester" },
      { key: "access_level", label: "Access" },
      { key: "status", label: "Status" },
      { key: "created_at", label: "Created" },
      { key: "_actions", label: "Actions" },
    ],
    []
  );

  const tableRows = rows.map((r) => {
    const statusUp = String(r.status || "UNKNOWN").toUpperCase();
    return {
      ...r,
      access_level: <Badge>{String(r.access_level || "UNKNOWN")}</Badge>,
      status: <Badge>{statusUp}</Badge>,
      created_at: (
        <span className="mono" title={r.created_at}>
          {String(r.created_at || "").replace("T", " ").slice(0, 19)}
        </span>
      ),
      _actions: (
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            alignItems: "center",
            flexWrap: "nowrap",
            whiteSpace: "nowrap",
            minWidth: 180,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              approve(r.id);
            }}
            disabled={loading}
            style={{ padding: "8px 12px" }}
          >
            Approve
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              reject(r.id);
            }}
            disabled={loading}
            style={{
              padding: "8px 12px",
              background: "#fff",
              border: "1px solid #ddd",
            }}
          >
            Reject
          </button>
        </div>
      ),
    };
  });

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Approvals</h2>

      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 220 }}>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 220 }}>
          <option value="DATA_OWNER">DATA_OWNER</option>
          <option value="DATA_STEWARD">DATA_STEWARD</option>
          <option value="TI_OWNER">TI_OWNER</option>
        </select>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Approver email</div>
          <input value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} />
        </div>

        <button onClick={load} disabled={loading} style={{ padding: "10px 14px" }}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Decision note</div>
        <input value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} />
      </div>

      {err && <div className="error" style={{ marginTop: 12 }}>⚠️ {String(err)}</div>}

      <div style={{ marginTop: 14 }}>
        <Table columns={columns} rows={tableRows} />
      </div>

      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
        Tip: Keep this repo public-safe. No credentials. Use mock mode for demos.
      </div>
    </div>
  );
}
