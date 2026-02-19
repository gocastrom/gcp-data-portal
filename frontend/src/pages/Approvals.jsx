import { useEffect, useState } from "react";
import { api } from "../api.js";
import Badge from "../components/Badge.jsx";

export default function Approvals() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState("DATA_OWNER");
  const [approverEmail, setApproverEmail] = useState("approver@company.com");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.listRequests(status);
      setItems(data.items || []);
    } catch (ex) {
      setErr(ex.message || "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  async function decide(id, decision) {
    try {
      const res = await api.approve(id, { role, approver_email: approverEmail, decision });
      if (res?.provisioning) {
        alert(`Provisioning: ${res.provisioning.ok ? "OK" : "FAILED"}\n${JSON.stringify(res.provisioning, null, 2)}`);
      }
      await load();
    } catch (ex) {
      alert(ex.message || "Error");
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Approvals</h2>
        <button className="secondary" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>View status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Your role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="DATA_OWNER">DATA_OWNER</option>
            <option value="DATA_STEWARD">DATA_STEWARD</option>
            <option value="IT_OWNER">IT_OWNER</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Approver email</label>
          <input value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} />
        </div>
      </div>

      {err && <div className="error">⚠️ {err}</div>}

      <div style={{ marginTop: 14 }}>
        {items.map((r) => (
          <div key={r.id} className="card" style={{ marginBottom: 10 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Request #{r.id}</div>
                <div style={{ opacity: 0.8 }}>{r.requester_email}</div>
              </div>
              <Badge>{r.status}</Badge>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Resource</div>
              <div className="mono">{r.linked_resource}</div>
            </div>

            <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
              <Badge>{r.access_level}</Badge>
              <div className="row">
                {status === "PENDING" && (
                  <>
                    <button className="secondary" onClick={() => decide(r.id, "REJECTED")}>Reject</button>
                    <button onClick={() => decide(r.id, "APPROVED")}>Approve</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginTop: 8, opacity: 0.8 }}>
              Reason: {r.reason}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ opacity: 0.7 }}>No requests in this status.</div>
        )}
      </div>
    </div>
  );
}
