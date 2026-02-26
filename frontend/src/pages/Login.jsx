import { useMemo, useState } from "react";
import { setSession } from "../store.js";

/**
 * MVP MOCK LOGIN
 * - Esto NO es seguridad real.
 * - En producción: Google OAuth/IAP + validación server-side + IAM.
 */
const DEMO_USERS = [
  { email: "viewer@company.com", role: "VIEWER" },
  { email: "data.steward@company.com", role: "DATA_STEWARD" },
  { email: "data.owner@company.com", role: "DATA_OWNER" },
  { email: "admin@company.com", role: "ADMIN" },
];

function LogoPlaceholder() {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #111 0%, #2c2c2c 100%)",
        border: "1px solid rgba(0,0,0,0.10)",
        boxShadow: "0 14px 35px rgba(0,0,0,0.12)",
        flex: "0 0 auto",
      }}
      title="Company Logo (placeholder)"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 16.7V7.7c0-.7.4-1.3 1-1.6l3.9-2.1c.7-.4 1.5-.4 2.2 0L17 6.1c.6.3 1 .9 1 1.6v9c0 .7-.4 1.3-1 1.6l-3.9 2.1c-.7.4-1.5.4-2.2 0L7 18.3c-.6-.3-1-.9-1-1.6Z"
          stroke="white"
          strokeWidth="1.7"
          opacity="0.95"
        />
        <path
          d="M8.3 9.4h7.4M8.3 12.1h7.4M8.3 14.8h4.8"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

function computeFlags(role) {
  const canSearch = true;

  // Reglas solicitadas:
  // - VIEWER: solo search
  // - OWNER y STEWARD: search + approvals, pero solo owner decide
  // - ADMIN: todo (incluye auditoría)
  const canSeeApprovals = role === "DATA_OWNER" || role === "DATA_STEWARD" || role === "ADMIN";
  const canDecide = role === "DATA_OWNER" || role === "ADMIN"; // Admin también podría decidir si quieres
  const canSeeAudit = role === "ADMIN";

  return { canSearch, canSeeApprovals, canDecide, canSeeAudit };
}

export default function Login({ onLoggedIn }) {
  const [sel, setSel] = useState(DEMO_USERS[0].email);

  const user = useMemo(
    () => DEMO_USERS.find((u) => u.email === sel) || DEMO_USERS[0],
    [sel]
  );

  function doLogin() {
    const flags = computeFlags(user.role);
    setSession({
      email: user.email,
      role: user.role,
      ...flags,
    });
    onLoggedIn && onLoggedIn();
  }

  return (
    <div style={{ minHeight: "calc(100vh - 32px)", display: "grid", placeItems: "center", padding: "18px 14px" }}>
      <div
        style={{
          width: "min(900px, 100%)",
          background: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 20,
          boxShadow: "0 18px 70px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "22px 22px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "linear-gradient(180deg, #fafbfc 0%, #f3f4f6 100%)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <LogoPlaceholder />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.4, color: "#111" }}>
              GCP Data Portal
            </div>
            <div style={{ marginTop: 2, fontSize: 13, opacity: 0.75, color: "#111" }}>
              Demo login (MVP). En producción: Google OAuth / IAP.
            </div>
          </div>
        </div>

        <div style={{ padding: "22px" }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 36, fontWeight: 950, letterSpacing: -1, color: "#111" }}>
              Login
            </div>
            <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75, color: "#111" }}>
              Selecciona un usuario demo para simular roles y permisos del portal.
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8, color: "#111" }}>
                Usuario demo
              </div>

              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                <select
                  value={sel}
                  onChange={(e) => setSel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.14)",
                    background: "white",
                    color: "#111",
                    fontSize: 16,
                    outline: "none",
                  }}
                >
                  {DEMO_USERS.map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.email} ({u.role})
                    </option>
                  ))}
                </select>

                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "rgba(0,0,0,0.04)",
                    color: "#111",
                    fontSize: 12,
                    minWidth: 260,
                    lineHeight: 1.2,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>Permisos</div>
                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    • Search: ✅
                  </div>
                  <div style={{ marginTop: 4, opacity: 0.85 }}>
                    • Approvals: {["DATA_OWNER", "DATA_STEWARD", "ADMIN"].includes(user.role) ? "✅" : "—"}
                  </div>
                  <div style={{ marginTop: 4, opacity: 0.85 }}>
                    • Decide: {["DATA_OWNER", "ADMIN"].includes(user.role) ? "✅" : "—"}
                  </div>
                  <div style={{ marginTop: 4, opacity: 0.85 }}>
                    • Audit: {user.role === "ADMIN" ? "✅" : "—"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7, color: "#111" }}>
                * En este MVP, <b>DATA_OWNER</b> es el aprobador principal. <b>DATA_STEWARD</b> solo visualiza.
              </div>
            </div>

            <button
              onClick={doLogin}
              style={{
                width: "100%",
                marginTop: 18,
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "linear-gradient(180deg, #111 0%, #000 100%)",
                color: "white",
                fontSize: 16,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 14px 40px rgba(0,0,0,0.18)",
              }}
            >
              Login
            </button>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 12, opacity: 0.7, color: "#111" }}>
              <span>Tip: repos públicos → sin credenciales. Mock para demos.</span>
              <span>Prod: IAP + Cloud Run + IAM (mínimo privilegio).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
