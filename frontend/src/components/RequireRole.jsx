import { Navigate } from "react-router-dom";
import { getAuth, hasRole } from "../auth.js";

export default function RequireRole({ allowed, children }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!hasRole(auth, allowed)) return <Navigate to="/search" replace />;
  return children;
}
