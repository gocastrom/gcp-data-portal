import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAuth, getAuth } from "../auth.js";

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: "none",
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #eee",
        background: isActive ? "#111" : "white",
        color: isActive ? "white" : "#111"
      })}
    >
      {label}
    </NavLink>
  );
}

export default function AppLayout() {
  const nav = useNavigate();
  const auth = getAuth();

  function logout() {
    clearAuth();
    nav("/login");
  }

  return (
    <div className="container">
      <div className="topbar">
        <div>
          <div className="title">GCP Data Portal</div>
          <div className="subtitle">Search · Request · Approve (MVP)</div>
        </div>

        <div className="topbar-right">
          <span className="badge">Demo</span>
          {auth ? (
            <>
              <span className="badge">{auth.role}</span>
              <span style={{ fontSize: 12, opacity: 0.75 }}>{auth.email}</span>
              <button className="secondary" onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="secondary" onClick={() => nav("/login")}>Login</button>
          )}
        </div>
      </div>

      <div className="nav">
        <NavItem to="/search" label="Search" />
        <NavItem to="/approvals" label="Approvals" />
      </div>

      <div className="card">
        <Outlet />
      </div>

      <div style={{ marginTop: 12, opacity: 0.6, fontSize: 12 }}>
        Tip: Keep this repo public-safe. No credentials. Use mock mode for demos.
      </div>
    </div>
  );
}
