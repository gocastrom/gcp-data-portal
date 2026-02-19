const KEY = "gcp-data-portal:auth";

export const ROLES = ["VIEWER", "REQUESTER", "APPROVER", "ADMIN"];

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setAuth(auth) {
  localStorage.setItem(KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function hasRole(auth, allowed) {
  if (!auth) return false;
  if (auth.role === "ADMIN") return true;
  return allowed.includes(auth.role);
}
