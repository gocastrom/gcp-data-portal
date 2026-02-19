const KEY = "gcp-data-portal:selected-asset";

export function setSelectedAsset(asset) {
  localStorage.setItem(KEY, JSON.stringify(asset || null));
}

export function getSelectedAsset() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}
