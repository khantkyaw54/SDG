const storageKey = "inside_town_favorites";

function readStore() {
  const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid favorites storage");
  }
  return value;
}

export function getFavorites(userId) {
  if (!userId) return [];
  try {
    const ids = readStore()[userId];
    return Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === "string"))] : [];
  } catch { return []; }
}

export function isFavorite(userId, shopId) {
  return getFavorites(userId).includes(String(shopId));
}

function updateFavorites(userId, shopId, removeOnly) {
  if (!userId) throw new Error("ログインしてください。");
  const store = readStore();
  const ids = getFavorites(userId);
  const id = String(shopId);
  const next = removeOnly || ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
  localStorage.setItem(storageKey, JSON.stringify({ ...store, [userId]: next }));
  window.dispatchEvent(new Event("inside-town-account-change"));
  return next;
}

export function toggleFavorite(userId, shopId) {
  return updateFavorites(userId, shopId, false);
}

export function removeFavorite(userId, shopId) {
  return updateFavorites(userId, shopId, true);
}
