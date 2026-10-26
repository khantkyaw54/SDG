const key = "inside_town_account_activity";

function readStore() {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch { return {}; }
}

function accountData(userId) {
  return userId ? readStore()[userId] || {} : {};
}

function update(userId, patch) {
  if (!userId) return;
  const store = readStore();
  localStorage.setItem(key, JSON.stringify({ ...store, [userId]: { ...accountData(userId), ...patch } }));
  window.dispatchEvent(new Event("inside-town-account-change"));
}

export function getVisitedShopIds(userId) {
  const ids = accountData(userId).visitedShopIds;
  return Array.isArray(ids) ? [...new Set(ids.map(String))] : [];
}

export function addVisitedShop(userId, shopId) {
  const ids = getVisitedShopIds(userId);
  const id = String(shopId);
  if (!ids.includes(id)) update(userId, { visitedShopIds: [...ids, id] });
}

export function getReviews(userId) {
  const reviews = accountData(userId).reviews;
  return Array.isArray(reviews) ? reviews : [];
}

export function getCoupons(userId) {
  const coupons = accountData(userId).coupons;
  return Array.isArray(coupons) ? coupons : [];
}

export function markCouponUsed(userId, couponId) {
  const coupons = getCoupons(userId);
  const coupon = coupons.find((item) => String(item.id) === String(couponId));
  if (!coupon || coupon.usedAt) return coupon || null;
  const usedAt = new Date().toISOString();
  const updated = { ...coupon, usedAt };
  update(userId, { coupons: coupons.map((item) => String(item.id) === String(couponId) ? updated : item) });
  return updated;
}

export function getRally(userId) {
  return accountData(userId).rally || null;
}

export function saveRallyDraft(userId, draft) {
  update(userId, { rallyDraft: draft });
}

export function getRallyDraft(userId) {
  return accountData(userId).rallyDraft || {};
}

export function saveRally(userId, rally) {
  update(userId, { rally });
}

export function collectRallyStamp(userId, shopId) {
  const rally = getRally(userId);
  if (!rally) return;
  const id = String(shopId);
  const requiredIds = (rally.shopIds || []).map(String);
  const existingStamps = (rally.stamps || []).map(String);
  if (!requiredIds.includes(id) || existingStamps.includes(id)) return;
  const stamps = [...existingStamps, id];
  const completed = stamps.length >= requiredIds.length;
  const coupons = accountData(userId).coupons || [];
  const couponId = `rally-${rally.city}-${rally.shopIds.join("-")}`;
  const issuedAt = new Date();
  const validUntil = new Date(issuedAt.getTime() + 6 * 24 * 60 * 60 * 1000);
  update(userId, {
    rally: { ...rally, stamps, completed },
    ...(completed && !coupons.some((coupon) => coupon.id === couponId)
      ? { coupons: [...coupons, {
        id: couponId,
        city: rally.city,
        title: `${rally.city} 地域応援お食事クーポン 500円分`,
        description: "スタンプラリー達成特典",
        validFrom: issuedAt.toISOString(),
        validUntil: validUntil.toISOString(),
        usedAt: null,
      }] }
      : {}),
  });
}
