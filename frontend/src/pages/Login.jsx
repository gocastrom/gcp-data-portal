import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES, setAuth } from "../auth.js";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("user@company.com");
  const [role, setRole] = useState("VIEWER");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    setErr("");

    if (!email.includes("@")) {
      setErr("Enter a valid email");
      return;
    }

    setAuth({ email: email.trim(), role });
    nav("/search");
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Login (Demo)</h2>
      <p style={{ opacity: 0.75 }}>
        This is a demo login for local testing. Replace with Google OAuth in enterprise mode.
      </p>

      <form onSubmit={submit} style={{ maxWidth: 520 }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, opacity: 0.7 }}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {err && <div className="error">⚠️ {err}</div>}

        <button style={{ marginTop: 10 }}>Enter</button>
      </form>

      <div style={{ marginTop: 14, opacity: 0.7, fontSize: 12 }}>
        Suggested demo roles:
        <ul>
          <li>VIEWER: only search and browse</li>
          <li>REQUESTER: can request access</li>
          <li>APPROVER: can approve requests</li>
          <li>ADMIN: all permissions</li>
        </ul>
      </div>
    </div>
  );
}
