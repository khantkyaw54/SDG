// API キーは .env に保存する。コードには直接書かない。
export const apiKey = import.meta.env.VITE_GEOAPIFY_KEY?.trim();

// 住所を緯度・経度に変換する。見つからなければ null を返す。
// signal は、ページ移動や再検索で古い通信を中止するために使う。
export async function searchAddress(address, signal, center) {
  const params = new URLSearchParams({
    text: address.trim(),
    limit: "1",
    lang: "ja",
    apiKey,
  });

  if (center) {
    params.set("bias", `proximity:${center.lng},${center.lat}`);
  }

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/search?${params}`,
    { signal },
  );
  if (!response.ok) throw new Error("住所検索に失敗しました。");

  const data = await response.json();
  const result = data.features?.[0];
  if (!result) return null;

  const [lng, lat] = result.geometry?.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return {
    lat,
    lng,
    formatted: result.properties?.formatted || address.trim(),
  };
}
