import { shops as sampleShops } from "./shops.js";

const storageKey = "inside_town_registered_shops";

export function readRegisteredShops() {
  const raw = localStorage.getItem(storageKey);

  if (!raw) return [];

  const saved = JSON.parse(raw);

  if (!Array.isArray(saved)) {
    throw new Error("Invalid shop storage");
  }

  return saved.filter(
    (shop) =>
      typeof shop?.id === "string" &&
      [shop.name, shop.category, shop.address].every(
        (value) => typeof value === "string"
      ) &&
      Number.isFinite(shop.lat) &&
      Math.abs(shop.lat) <= 90 &&
      Number.isFinite(shop.lng) &&
      Math.abs(shop.lng) <= 180
  );
}

export function getShops() {
  try {
    return [
      ...sampleShops,
      ...readRegisteredShops(),
    ];
  } catch {
    return [...sampleShops];
  }
}

export function saveShop(shop) {
  const saved = readRegisteredShops();

  const existing = saved.find(
    (item) =>
      item.id === shop.id ||
      (
        item.name === shop.name &&
        item.address === shop.address
      )
  );

  const entry = {
    ...shop,
    id:
      existing?.id ||
      shop.id ||
      `local-${crypto.randomUUID()}`,
  };

  let next;

  if (existing) {
    next = saved.map((item) => {
      if (item.id === existing.id) {
        return entry;
      }

      return item;
    });
  } else {
    next = [...saved, entry];
  }

  localStorage.setItem(
    storageKey,
    JSON.stringify(next)
  );

  return entry;
}

export function deleteShop(id) {
  const saved = readRegisteredShops();

  const next = saved.filter(
    (shop) => shop.id !== id
  );

  localStorage.setItem(
    storageKey,
    JSON.stringify(next)
  );
}