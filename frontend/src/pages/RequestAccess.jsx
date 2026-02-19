import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { getSelectedAsset } from "../store.js";
import { getAuth } from "../auth.js";

export default function RequestAccess() {
  const nav = useNavigate();
  const asset = useMemo(() => getSelectedAsset(), []);
  const auth = getAuth();

  const [email, setEmail] = useState(auth?.email || "");
  const [level, setLevel] = useState("READ_TABLE");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!asset) return setErr("No asset selected (go to Search and open an asset first)");
    if (!email.includes("@")) return setErr("Enter a valid email");
    if (reason.trim().length < 5) return setErr("Reason must be at least 5 characters");

    setLoading(true);
    try {
      const res = await api.createRequest({
        requester_email: email.trim(),
        linked_resource: asset.linked_resource,
        access_level: level,
        reason: reason.trim()
      });
      setOk(`Request created: #${res.request_id}`);
    } catch (ex) {
      setErr(ex.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Request Access</h2>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ opacity: 0.8, marginBottom: 6 }}>Asset</div>
        <div className="mono">{asset?.linked_resource || "-"}</div>
      </div>

      <form onSubmit={submit} style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Requester email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Access level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="READ_TABLE">READ_TABLE</option>
            <option value="READ_DATASET">READ_DATASET</option>
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
        </div>

        {err && <div className="error">⚠️ {err}</div>}
        {ok && <div style={{ marginTop: 10, opacity: 0.9 }}>✅ {ok}</div>}

        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="secondary" onClick={() => nav("/asset")}>Back</button>
          <button disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
          <button type="button" className="secondary" onClick={() => nav("/approvals")}>Go to Approvals</button>
        </div>
      </form>
    </div>
  );
}
