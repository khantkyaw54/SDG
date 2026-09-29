import { Marker } from "maplibre-gl";

// カテゴリ名から、public/map_icons.svg のアイコンを選ぶ。
export function categoryIcon(category) {
  const icons = { カフェ: "cafe", 洋食: "food", 和菓子: "sweet" };
  return icons[category] || "map";
}

// 地図の色・タイル設定。見た目を変えるときはここを編集する。
export function createMapStyle(apiKey) {
  return {
    version: 8,
    sources: {
      geoapify: {
        type: "raster",
        tiles: [
          `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=${encodeURIComponent(apiKey)}`,
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution:
          '<a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> | <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
      },
    },
    layers: [
      {
        id: "geoapify",
        type: "raster",
        source: "geoapify",
        paint: { "raster-saturation": -0.45, "raster-contrast": -0.15, "raster-brightness-min": 0.16 },
      },
    ],
  };
}

// 検索欄や店舗カードにピンが隠れないよう、表示位置を調整する。
export function focusLocation(
  instance,
  coordinates,
  zoom = 16,
  animate = true,
) {
  const canvas = instance.getContainer();
  const page = canvas.closest(".p-map");
  const bounds = canvas.getBoundingClientRect();
  const selected = page.classList.contains("has-shop");
  const panel = page.querySelector(selected ? ".c-shop_sheet" : ".p-map__discovery").getBoundingClientRect();
  const top = page.querySelector(".p-map__top").getBoundingClientRect();
  const padding = {
    top: selected ? 8 : Math.min(Math.ceil(top.bottom - bounds.top + 16), bounds.height * 0.3),
    bottom: Math.min(
      Math.ceil(bounds.bottom - panel.top + (selected ? 0 : 24)),
      bounds.height * (selected ? 0.88 : 0.45),
    ),
    left: 40,
    right: 40,
  };
  instance.resize();
  const camera = { center: coordinates, zoom, padding };
  if (animate) instance.flyTo(camera);
  else instance.jumpTo(camera);
}

// 店舗名は textContent で表示し、HTML として実行させない。
export function createShopMarker(shop, map, selectedId, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `c-map_pin${shop.id === selectedId ? " is-selected" : ""}`;
  button.style.setProperty("--pin-color", ({ カフェ: "#83bb58", 洋食: "#ff9c25", 和菓子: "#fa8198" })[shop.category] || "#4a9bff");
  button.setAttribute("aria-label", `${shop.name}を表示`);
  const dot = document.createElement("span");
  dot.className = "c-map_pin__dot";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", "18");
  icon.setAttribute("height", "18");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `/map_icons.svg#${categoryIcon(shop.category)}`);
  icon.append(use);
  dot.append(icon);
  const label = document.createElement("span");
  label.className = "c-map_pin__label";
  label.textContent = shop.name;
  button.append(dot, label);
  button.addEventListener("click", () => onSelect(shop));
  return new Marker({ element: button })
    .setLngLat([shop.lng, shop.lat])
    .addTo(map);
}
