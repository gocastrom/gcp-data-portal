const KEY = "gcp_data_portal_session_v1";
const ASSET_KEY = "gcp_data_portal_selected_asset_v1";

/**
 * MVP MOCK GRANTS
 * - Stored in localStorage
 * - In production this is IAM / BigQuery dataset/table permissions (or Dataplex policies)
 */
const GRANTS_KEY = "gcp_data_portal_grants_v1";

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  if (!session) return localStorage.removeItem(KEY);
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function getSelectedAsset() {
  try {
    const raw = localStorage.getItem(ASSET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSelectedAsset(asset) {
  if (!asset) return localStorage.removeItem(ASSET_KEY);
  localStorage.setItem(ASSET_KEY, JSON.stringify(asset));
}

function _loadGrants() {
  try {
    const raw = localStorage.getItem(GRANTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function _saveGrants(grants) {
  localStorage.setItem(GRANTS_KEY, JSON.stringify(grants || {}));
}

/**
 * grant structure:
 * {
 *   "user@company.com": {
 *      "bigquery://demo.retail.sales_daily_gold": { level:"READER", approved_by:"x", ts:"..." }
 *   }
 * }
 */
export function addGrant(email, linked_resource, meta = {}) {
  const grants = _loadGrants();
  if (!grants[email]) grants[email] = {};
  grants[email][linked_resource] = {
    level: meta.level || "READER",
    approved_by: meta.approved_by || "mock",
    ts: meta.ts || new Date().toISOString(),
  };
  _saveGrants(grants);
}

export function revokeGrant(email, linked_resource) {
  const grants = _loadGrants();
  if (grants[email] && grants[email][linked_resource]) {
    delete grants[email][linked_resource];
    _saveGrants(grants);
  }
}

export function hasGrant(email, linked_resource) {
  const grants = _loadGrants();
  return !!(email && linked_resource && grants[email] && grants[email][linked_resource]);
}

/**
 * Access rules (MVP):
 * - ADMIN: access to everything
 * - DATA_OWNER: access to everything
 * - DATA_STEWARD: access to everything
 * - REQUESTER/VIEWER: only if explicit grant exists (after approval) OR if it's a non-restricted asset (optional)
 *
 * For your requirement: validate if user has access; if not, show request module.
 */
export function computeAccess({ session, asset }) {
  const email = session?.email;
  const role = session?.role;

  if (!email || !asset?.linked_resource) {
    return { hasAccess: false, reason: "No session / asset" };
  }

  if (role === "ADMIN" || role === "DATA_OWNER" || role === "DATA_STEWARD") {
    return { hasAccess: true, reason: "Privileged role" };
  }

  if (hasGrant(email, asset.linked_resource)) {
    return { hasAccess: true, reason: "Granted (mock)" };
  }

  return { hasAccess: false, reason: "No grant yet" };
}
