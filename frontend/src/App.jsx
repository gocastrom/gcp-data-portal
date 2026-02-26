import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Search from "./pages/Search.jsx";
import Asset from "./pages/Asset.jsx";
import Approvals from "./pages/Approvals.jsx";
import Audit from "./pages/Audit.jsx";
import Login from "./pages/Login.jsx";
import { clearSession, getSession } from "./store.js";

function Header({ session, onLogout }) {
  return (
    <div className="header">
      <div>
        <div className="title">GCP Data Portal</div>
        <div className="subtitle">Search · Request · Approve (MVP)</div>
      </div>
      <div className="headerRight">
        <span className="pill">Demo</span>
        <span className="pill">{session?.role || "—"}</span>
        <span className="pill">{session?.email || "—"}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

function Guard({ allow, redirectTo = "/", children }) {
  const nav = useNavigate();
  useEffect(() => {
    if (!allow) nav(redirectTo, { replace: true });
  }, [allow, nav, redirectTo]);
  if (!allow) return null;
  return children;
}

export default function App() {
  const nav = useNavigate();
  const loc = useLocation();
  const [session, setSessionState] = useState(() => getSession());

  useEffect(() => {
    const onStorage = () => setSessionState(getSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isAuthed = !!session?.email;

  useEffect(() => {
    if (!isAuthed && loc.pathname !== "/login") nav("/login", { replace: true });
    if (isAuthed && loc.pathname === "/login") nav("/", { replace: true });
  }, [isAuthed, loc.pathname, nav]);

  const onLogout = () => {
    clearSession();
    setSessionState(null);
    nav("/login", { replace: true });
  };

  if (!isAuthed) {
    return (
      <div className="container">
        <Routes>
          <Route path="*" element={<Login onLoggedIn={() => setSessionState(getSession())} />} />
        </Routes>
      </div>
    );
  }

  const canSeeApprovals = !!session?.canSeeApprovals;
  const canSeeAudit = !!session?.canSeeAudit;

  return (
    <div className="container">
      <Header session={session} onLogout={onLogout} />

      <div className="tabs">
        <Link className={`tab ${loc.pathname === "/" ? "active" : ""}`} to="/">
          Search
        </Link>

        {canSeeApprovals && (
          <Link className={`tab ${loc.pathname.startsWith("/approvals") ? "active" : ""}`} to="/approvals">
            Approvals
          </Link>
        )}

        {canSeeAudit && (
          <Link className={`tab ${loc.pathname.startsWith("/audit") ? "active" : ""}`} to="/audit">
            Audit
          </Link>
        )}
      </div>

      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/asset" element={<Asset />} />

        <Route
          path="/approvals"
          element={
            <Guard allow={canSeeApprovals} redirectTo="/">
              <Approvals />
            </Guard>
          }
        />

        <Route
          path="/audit"
          element={
            <Guard allow={canSeeAudit} redirectTo="/">
              <Audit />
            </Guard>
          }
        />

        <Route path="*" element={<Search />} />
      </Routes>
    </div>
  );
}
