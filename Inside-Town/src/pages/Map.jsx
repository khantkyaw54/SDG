import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Map as MapLibreMap, Marker, Popup, NavigationControl, GeolocateControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getShops } from "../data/shop_storage";
import BottomNav from "../components/BottomNav";

const apiKey = import.meta.env.VITE_GEOAPIFY_KEY?.trim();
const categoryIcon = (category) => ({ カフェ: "cafe", 洋食: "food", 和菓子: "sweet" })[category] || "map";


export default function Map() {
    const [params] = useSearchParams();
    return <MapView key={params.get("shop") || "all"} />;
}

function focusLocation(instance, coordinates, zoom = 16, animate = true) {
    const canvas = instance.getContainer();
    const page = canvas.closest(".p-map");
    const bounds = canvas.getBoundingClientRect();
    const panel = page.querySelector(".p-map__discovery").getBoundingClientRect();
    const top = page.querySelector(".p-map__top").getBoundingClientRect();
    const desktop = bounds.width >= 768;
    const padding = desktop
        ? { top: 32, bottom: 48, left: Math.min(Math.ceil(panel.right - bounds.left + 32), bounds.width / 2), right: 64 }
        : { top: Math.min(Math.ceil(top.bottom - bounds.top + 16), bounds.height * .3), bottom: Math.min(Math.ceil(bounds.bottom - panel.top + 24), bounds.height * .45), left: 40, right: 40 };
    instance.resize();
    const camera = { center: coordinates, zoom, padding };
    if (animate) instance.flyTo(camera);
    else instance.jumpTo(camera);
}

function MapView() {
    const [shops] = useState(getShops);
    const [params] = useSearchParams();
    const [focusedShop] = useState(() => shops.find((shop) => String(shop.id) === params.get("shop")));
    const categories = ["すべて", ...new Set(shops.map((shop) => shop.category))];
    const container = useRef(null);
    const map = useRef(null);
    const markers = useRef([]);
    const searchMarker = useRef(null);
    const request = useRef(null);
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [category, setCategory] = useState("すべて");
    const [selected, setSelected] = useState(focusedShop || null);
    const visibleShops = shops.filter((shop) => category === "すべて" || shop.category === category);

    useEffect(() => {
        if (!apiKey) return;
        let instance;
        let disposed = false;
        try {
            instance = new MapLibreMap({
                container: container.current,
                style: {
                    version: 8,
                    sources: {
                        geoapify: {
                            type: "raster",
                            tiles: [`https://maps.geoapify.com/v1/tile/positron/{z}/{x}/{y}@2x.png?apiKey=${encodeURIComponent(apiKey)}`],
                            tileSize: 256,
                            maxzoom: 20,
                            attribution: '<a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> | <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
                        },
                    },
                    layers: [{ id: "geoapify", type: "raster", source: "geoapify" }],
                },
                center: focusedShop ? [focusedShop.lng, focusedShop.lat] : [136.8815, 35.1709],
                zoom: focusedShop ? 16 : 14.5,
                attributionControl: { compact: true },
            });
            map.current = instance;
            instance.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
            const location = new GeolocateControl({
                positionOptions: { enableHighAccuracy: true, timeout: 10000 },
                trackUserLocation: true,
                showAccuracyCircle: true,
            });
            instance.addControl(location, "bottom-right");
            location.on("error", () => {
                if (!disposed) setNotice("現在地を取得できません。位置情報の許可を確認するか、場所を検索してください。");
            });
            location.on("geolocate", () => { if (!disposed) setNotice(""); });
            instance.on("load", () => {
                if (!disposed) {
                    setReady(true); setError("");
                    if (focusedShop) focusLocation(instance, [focusedShop.lng, focusedShop.lat], 16, false);
                }
            });
            instance.on("error", (event) => {
                if (disposed) return;
                const status = event.error?.status;
                setError(status === 401 || status === 403
                    ? "地図へのアクセスが拒否されました。GeoapifyのAPIキーと許可ドメインを確認してください。"
                    : "地図の一部を読み込めませんでした。通信環境を確認して再読み込みしてください。");
            });
            instance.on("idle", () => {
                if (!disposed && instance.areTilesLoaded()) setError("");
            });
            markers.current = shops.map((shop) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `c-map_pin${shop.id === focusedShop?.id ? " is-selected" : ""}`;
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
                button.addEventListener("click", () => {
                    setSelected(shop);
                    focusLocation(instance, [shop.lng, shop.lat]);
                });
                return { shop, marker: new Marker({ element: button }).setLngLat([shop.lng, shop.lat]).addTo(instance) };
            });
            if (focusedShop) focusLocation(instance, [focusedShop.lng, focusedShop.lat], 16, false);
        } catch {
            // Defer initial failure so the effect only synchronizes with the map API.
            queueMicrotask(() => { if (!disposed) setError("地図を起動できませんでした。ブラウザのWebGL設定を確認してください。"); });
        }
        return () => {
            disposed = true;
            request.current?.abort();
            searchMarker.current?.remove();
            searchMarker.current = null;
            markers.current.forEach(({ marker }) => marker.remove());
            markers.current = [];
            instance?.remove();
            map.current = null;
        };
    }, [shops, focusedShop]);

    useEffect(() => {
        markers.current.forEach(({ shop, marker }) => {
            marker.getElement().hidden = category !== "すべて" && shop.category !== category;
            marker.getElement().classList.toggle("is-selected", shop.id === selected?.id);
        });
    }, [category, selected]);

    const handleSearch = async (event) => {
        event.preventDefault();
        if (!query.trim() || !map.current || !ready) return;
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setSearching(true);
        setNotice("");
        try {
            const center = map.current.getCenter();
            const params = new URLSearchParams({ text: query.trim(), limit: "1", lang: "ja", bias: `proximity:${center.lng},${center.lat}`, apiKey });
            const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`, { signal: controller.signal });
            if (!response.ok) throw new Error("Search failed");
            const data = await response.json();
            if (controller.signal.aborted || !map.current) return;
            const result = data.features?.[0];
            const coordinates = result?.geometry?.coordinates;
            if (!coordinates || !coordinates.slice(0, 2).every(Number.isFinite)) {
                setNotice("場所が見つかりませんでした。別の地名や住所で検索してください。");
                return;
            }
            setSelected(null);
            focusLocation(map.current, coordinates, 15);
            searchMarker.current?.remove();
            const label = document.createElement("strong");
            label.textContent = result.properties?.formatted || query.trim();
            searchMarker.current = new Marker({ color: "#2A9D8F" })
                .setLngLat(coordinates)
                .setPopup(new Popup({ offset: 28 }).setDOMContent(label))
                .addTo(map.current);
            searchMarker.current.togglePopup();
        } catch (failure) {
            if (failure.name !== "AbortError" && !controller.signal.aborted) setNotice("検索できませんでした。通信環境を確認して、もう一度お試しください。");
        } finally {
            if (!controller.signal.aborted) setSearching(false);
        }
    };

    const chooseShop = (shop) => {
        setSelected(shop);
        if (map.current) focusLocation(map.current, [shop.lng, shop.lat]);
    };

    return (
        <main className="p-map">
            <div ref={container} className="p-map__canvas" aria-label="周辺のお店の地図" />
            {params.get("shop") && !focusedShop && <div className="p-map__missing" role="alert">このブラウザに店舗が見つかりません。登録したときと同じURLで開いてください。<button type="button" onClick={() => navigate("/shop")}>店舗ページに戻る</button></div>}
            <div className="p-map__top">
                <div className="p-map__brand"><span className="p-map__brand_mark">it.</span><div><strong>INSIDE TOWN</strong><span>いつもの街に、新しい発見。</span></div></div>
                <form className="c-map_search" onSubmit={handleSearch}>
                    <span className="c-map_search__brand" aria-hidden="true">i<span>.</span></span>
                    <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="地名・住所を検索" aria-label="地名・住所を検索" />
                    <button type="submit" disabled={searching || !ready || !query.trim()} aria-label="検索">
                        {searching ? "…" : <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>}
                    </button>
                </form>
                <div className="p-map__filters" aria-label="お店のカテゴリ">
                    {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} className={`c-map_filter ${category === item ? "is-active" : ""}`} onClick={() => { setCategory(item); setSelected(null); }}><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><use href={`/map_icons.svg#${categoryIcon(item)}`} /></svg>{item}</button>)}
                </div>
                {(!apiKey || error || notice || !ready) && <div className="p-map__notice" role="status">
                    {!apiKey ? "Geoapify APIキーが未設定です。.env に VITE_GEOAPIFY_KEY を設定して開発サーバーを再起動してください。" : error || notice || "地図を読み込んでいます…"}
                    {error && <button type="button" onClick={() => window.location.reload()}>再読み込み</button>}
                </div>}
            </div>
            <section className="p-map__discovery" aria-label="掲載されているお店">
                <div className="p-map__heading"><div><span>LOCAL DISCOVERIES</span><h1>{selected ? "街で見つけた、いいお店。" : "地元の小さなお店を発見"}</h1></div><span className="p-map__count">{visibleShops.length}件</span></div>
                {selected ? <article className="c-map_shop c-map_shop--selected">
                    <div><span className="c-map_shop__category">{selected.category}</span><h2>{selected.name}</h2><p>{selected.address}</p></div>
                    <button className="c-map_shop__close" type="button" aria-label="お店の選択を解除" onClick={() => setSelected(null)}>×</button>
                    <button className="c-map_shop__locate" type="button" onClick={() => chooseShop(selected)}>ピンの位置へ</button>
                    <button className="c-map_shop__detail" type="button" onClick={() => navigate(`/detail/${selected.id}`)}>お店の詳細を見る →</button>
                </article> : <div className="p-map__shops">{visibleShops.map((shop) => <button className="c-map_shop" key={shop.id} onClick={() => chooseShop(shop)} type="button"><span className="c-map_shop__category"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><use href={`/map_icons.svg#${categoryIcon(shop.category)}`} /></svg>{shop.category}</span><h2>{shop.name}</h2><p>{shop.address}</p><span className="c-map_shop__link">地図で見る ↗</span></button>)}</div>}
                <p className="p-map__sample">サンプル店舗と、このブラウザで追加した店舗を表示</p>
            </section>
            <BottomNav />
        </main>
    );
}
