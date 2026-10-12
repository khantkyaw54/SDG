// Geoapify routing uses latitude,longitude waypoints and GeoJSON longitude,latitude geometry.
export function currentPosition(signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) return abort();
    if (!navigator.geolocation) return reject(new Error("このブラウザでは現在地を取得できません。"));
    signal.addEventListener("abort", abort, { once: true });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        signal.removeEventListener("abort", abort);
        resolve({ lat: coords.latitude, lng: coords.longitude });
      },
      (error) => {
        signal.removeEventListener("abort", abort);
        reject(new Error(error.code === 1
          ? "位置情報の利用が許可されていません。ブラウザの設定をご確認ください。"
          : error.code === 3 ? "現在地の取得がタイムアウトしました。もう一度お試しください。"
            : "現在地を取得できませんでした。通信環境と位置情報の設定をご確認ください。"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}

export async function requestWalkingRoute(origin, destination, apiKey, signal) {
  if (!apiKey) throw new Error("ルートを利用できません。地図のAPI設定をご確認ください。");
  const params = new URLSearchParams({
    waypoints: `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`,
    mode: "walk", units: "metric", format: "geojson", apiKey,
  });
  const response = await fetch(`https://api.geoapify.com/v1/routing?${params}`, { signal });
  if (!response.ok) throw new Error("ルートを取得できませんでした。時間をおいてもう一度お試しください。");
  const data = await response.json();
  const feature = data.features?.[0];
  const geometry = feature?.geometry;
  const coordinates = geometry?.type === "MultiLineString" ? geometry.coordinates.flat()
    : geometry?.type === "LineString" ? geometry.coordinates : [];
  if (!coordinates?.length || !coordinates.every((point) => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]))
    || !Number.isFinite(feature?.properties?.time) || feature.properties.time < 0
    || !Number.isFinite(feature?.properties?.distance) || feature.properties.distance < 0) {
    throw new Error("徒歩ルートが見つかりませんでした。");
  }
  return { feature, coordinates, time: feature.properties.time, distance: feature.properties.distance };
}

export function routeSummary(route) {
  const distance = route.distance < 1000 ? `${Math.round(route.distance)} m` : `${(route.distance / 1000).toFixed(1)} km`;
  return `徒歩 約${Math.max(1, Math.ceil(route.time / 60))}分・${distance}`;
}

export function clearRoute(instance) {
  if (instance.getLayer("walking-route")) instance.removeLayer("walking-route");
  if (instance.getSource("walking-route")) instance.removeSource("walking-route");
}

export function drawRoute(instance, route, origin, destination) {
  clearRoute(instance);
  instance.addSource("walking-route", { type: "geojson", data: route.feature });
  instance.addLayer({
    id: "walking-route", type: "line", source: "walking-route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#2fa99a", "line-width": 5 },
  });
  const points = [...route.coordinates, [origin.lng, origin.lat], [destination.lng, destination.lat]];
  const bounds = points.reduce((box, [lng, lat]) => [
    [Math.min(box[0][0], lng), Math.min(box[0][1], lat)],
    [Math.max(box[1][0], lng), Math.max(box[1][1], lat)],
  ], [[Infinity, Infinity], [-Infinity, -Infinity]]);
  const height = instance.getContainer().clientHeight;
  // The shop sheet leaves a large camera padding; clear it before fitting a full-map route.
  instance.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
  instance.fitBounds(bounds, { padding: { top: Math.min(280, height * 0.4), bottom: Math.min(160, height * 0.25), left: 40, right: 88 }, maxZoom: 17, duration: 600 });
}
