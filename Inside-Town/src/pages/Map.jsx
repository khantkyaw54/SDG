import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Map as MapLibreMap,
    Marker,
    Popup,
    NavigationControl,
    GeolocateControl,
    setWorkerUrl,
} from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { getShops } from "../data/shop_storage";
import BottomNav from "../components/BottomNav";
import ShopBottomSheet from "../components/shop_bottom_sheet";
import { Link } from "react-router-dom";

import { currentPosition, requestWalkingRoute, routeSummary, drawRoute, clearRoute } from "../utils/routing";
import { apiKey, searchAddress } from "../utils/geoapify";
import {
    categoryIcon,
    createMapStyle,
    createShopMarker,
    focusLocation,
} from "../utils/map_helpers";

// Let Vite resolve the worker for both localhost and the /SDG/ production base.
setWorkerUrl(mapWorkerUrl);

export default function Map() {
    const [params] = useSearchParams();
    return <MapView key={params.get("shop") || "all"} />;
}

function MapView() {
    const [shops] = useState(getShops);
    const [params] = useSearchParams();
    const [focusedShop] = useState(() =>
        shops.find((shop) => String(shop.id) === params.get("shop")),
    );
    const categories = ["すべて", ...new Set(shops.map((shop) => shop.category))];
    const container = useRef(null);
    const map = useRef(null);
    const markers = useRef([]);
    const searchMarker = useRef(null);
    const request = useRef(null);
    const routeSession = useRef(null);
    const [routeStatus, setRouteStatus] = useState(null);
    const cancelRoute = useCallback(() => {
        const session = routeSession.current;
        session?.controller.abort();
        session?.marker?.remove();
        if (map.current) {
            clearRoute(map.current);
            if (session?.camera) map.current.jumpTo(session.camera);
        }
        routeSession.current = null;
        setRouteStatus(null);
    }, []);
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [category, setCategory] = useState("すべて");
    const [selected, setSelected] = useState(focusedShop || null);
    const visibleShops = shops.filter(
        (shop) => category === "すべて" || shop.category === category,
    );

    // ページを開いたら地図を作り、閉じたら地図と通信を片付ける。
    useEffect(() => {
        if (!apiKey) return;
        let instance;
        let disposed = false;
        try {
            instance = new MapLibreMap({
                container: container.current,
                style: createMapStyle(apiKey),
                center: focusedShop
                    ? [focusedShop.lng, focusedShop.lat]
                    : [136.8815, 35.1709],
                zoom: focusedShop ? 16 : 14.5,
                attributionControl: { compact: true },
            });
            map.current = instance;
            instance.addControl(
                new NavigationControl({ showCompass: false }),
                "bottom-right",
            );
            const location = new GeolocateControl({
                positionOptions: { enableHighAccuracy: true, timeout: 10000 },
                trackUserLocation: true,
                showAccuracyCircle: true,
            });
            instance.addControl(location, "bottom-right");
            location.on("error", () => {
                if (!disposed)
                    setNotice(
                        "現在地を取得できません。位置情報の許可を確認するか、場所を検索してください。",
                    );
            });
            location.on("geolocate", () => {
                if (!disposed) setNotice("");
            });
            instance.on("load", () => {
                if (!disposed) {
                    setReady(true);
                    setError("");
                    if (focusedShop)
                        focusLocation(
                            instance,
                            [focusedShop.lng, focusedShop.lat],
                            16,
                            false,
                        );
                }
            });
            instance.on("error", (event) => {
                if (disposed) return;
                const status = event.error?.status;
                setError(
                    status === 401 || status === 403
                        ? "地図へのアクセスが拒否されました。GeoapifyのAPIキーと許可ドメインを確認してください。"
                        : "地図の一部を読み込めませんでした。通信環境を確認して再読み込みしてください。",
                );
            });
            instance.on("idle", () => {
                if (!disposed && instance.areTilesLoaded()) setError("");
            });
            markers.current = shops.map((shop) => {
                const marker = createShopMarker(
                    shop,
                    instance,
                    focusedShop?.id,
                    (clickedShop) => {
                        cancelRoute();
                        setSelected(clickedShop);
                        focusLocation(instance, [clickedShop.lng, clickedShop.lat]);
                    },
                );
                return { shop, marker };
            });
            if (focusedShop)
                focusLocation(instance, [focusedShop.lng, focusedShop.lat], 16, false);
        } catch {
            // Defer initial failure so the effect only synchronizes with the map API.
            queueMicrotask(() => {
                if (!disposed)
                    setError(
                        "地図を起動できませんでした。ブラウザのWebGL設定を確認してください。",
                    );
            });
        }
        return () => {
            disposed = true;
            request.current?.abort();
            routeSession.current?.controller.abort();
            routeSession.current?.marker?.remove();
            routeSession.current = null;
            searchMarker.current?.remove();
            searchMarker.current = null;
            markers.current.forEach(({ marker }) => marker.remove());
            markers.current = [];
            instance?.remove();
            map.current = null;
        };
    }, [shops, focusedShop, cancelRoute]);

    useEffect(() => {
        markers.current.forEach(({ shop, marker }) => {
            marker.getElement().hidden =
                category !== "すべて" && shop.category !== category;
            marker
                .getElement()
                .classList.toggle("is-selected", shop.id === selected?.id);
        });
    }, [category, selected]);

    useEffect(() => {
        if (!selected) return;
        const timer = window.setTimeout(() => {
            if (map.current && !routeSession.current) focusLocation(map.current, [selected.lng, selected.lat]);
        }, 340);
        return () => window.clearTimeout(timer);
    }, [selected]);

    // 検索 → 地図を移動 → 検索結果のピンを表示。
    const handleSearch = async (event) => {
        event.preventDefault();
        if (!query.trim() || !map.current || !ready) return;
        cancelRoute();
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setSearching(true);
        setNotice("");
        try {
            const center = map.current.getCenter();
            const result = await searchAddress(query, controller.signal, center);
            if (controller.signal.aborted || !map.current) return;
            if (!result) {
                setNotice(
                    "場所が見つかりませんでした。別の地名や住所で検索してください。",
                );
                return;
            }
            const coordinates = [result.lng, result.lat];
            setSelected(null);
            focusLocation(map.current, coordinates, 15);
            searchMarker.current?.remove();
            const label = document.createElement("strong");
            label.textContent = result.formatted;
            searchMarker.current = new Marker({ color: "#2A9D8F" })
                .setLngLat(coordinates)
                .setPopup(new Popup({ offset: 28 }).setDOMContent(label))
                .addTo(map.current);
            searchMarker.current.togglePopup();
        } catch (failure) {
            if (failure.name !== "AbortError" && !controller.signal.aborted)
                setNotice(
                    "検索できませんでした。通信環境を確認して、もう一度お試しください。",
                );
        } finally {
            if (!controller.signal.aborted) setSearching(false);
        }
    };

    const chooseShop = (shop) => {
        cancelRoute();
        setSelected(shop);
        if (map.current) focusLocation(map.current, [shop.lng, shop.lat]);
    };

    const handleRoute = async (shop) => {
        cancelRoute();
        if (!map.current || !ready) {
            setRouteStatus({ message: "地図の読み込みが完了してからお試しください。" });
            return;
        }
        const instance = map.current;
        const controller = new AbortController();
        const session = {
            controller, camera: {
                center: instance.getCenter(), zoom: instance.getZoom(),
                bearing: instance.getBearing(), pitch: instance.getPitch(),
                padding: { top: 0, bottom: 0, left: 0, right: 0 },
            }
        };
        routeSession.current = session;
        setRouteStatus({ loading: true, message: "現在地から徒歩ルートを検索しています…" });
        const timeout = window.setTimeout(() => {
            if (routeSession.current !== session) return;
            controller.abort();
            setRouteStatus({ message: "ルート検索がタイムアウトしました。もう一度お試しください。" });
        }, 30000);
        try {
            const origin = await currentPosition(controller.signal);
            if (controller.signal.aborted) return;
            const route = await requestWalkingRoute(origin, shop, apiKey, controller.signal);
            if (controller.signal.aborted || map.current !== instance) return;
            drawRoute(instance, route, origin, shop);
            session.marker = new Marker({ color: "#168bff" }).setLngLat([origin.lng, origin.lat]).addTo(instance);
            session.marker.getElement().setAttribute("aria-label", "ルートの出発地（現在地）");
            setRouteStatus({ message: `${shop.name}まで ${routeSummary(route)}`, active: true });
            setSelected(null);
        } catch (failure) {
            if (controller.signal.aborted) return;
            clearRoute(instance);
            session.marker?.remove();
            setRouteStatus({
                message: failure instanceof TypeError
                    ? "ルートを取得できませんでした。通信環境を確認してください。" : failure.message
            });
        } finally {
            window.clearTimeout(timeout);
        }
    };

    let statusMessage = "";
    if (!apiKey) {
        statusMessage =
            "Geoapify APIキーが未設定です。.env に VITE_GEOAPIFY_KEY を設定して開発サーバーを再起動してください。";
    } else if (error || notice) {
        statusMessage = error || notice;
    } else if (!ready) {
        statusMessage = "地図を読み込んでいます…";
    }

    return (
        <main className={`p-map ${selected ? "has-shop" : ""}`}>
            <div
                ref={container}
                className="p-map__canvas"
                aria-label="周辺のお店の地図"
            />
            {params.get("shop") && !focusedShop && (
                <div className="p-map__missing" role="alert">
                    このブラウザに店舗が見つかりません。登録したときと同じURLで開いてください。
                    <button type="button" onClick={() => navigate("/shop")}>
                        店舗ページに戻る
                    </button>
                </div>
            )}
            <div className="p-map__top">
                <div className="p-map__brand">
                    <Link to="/select">
                        <span className="p-map__brand_mark">it.</span>
                    </Link>                    <div>
                        <strong>INSIDE TOWN</strong>
                        <span>いつもの街に、新しい発見。</span>
                    </div>
                </div>
                {/* <form className="c-map_search" onSubmit={handleSearch}>
                    <span className="c-map_search__brand" aria-hidden="true">
                        まちぐる
                    </span>
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="地名・住所を検索"
                        aria-label="地名・住所を検索"
                    />
                    <button
                        type="submit"
                        disabled={searching || !ready || !query.trim()}
                        aria-label="検索"
                    >
                        {searching ? (
                            "…"
                        ) : (
                            <svg
                                viewBox="0 0 24 24"
                                width="24"
                                height="24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <circle cx="10.5" cy="10.5" r="6.5" />
                                <path d="m16 16 5 5" />
                            </svg>
                        )}
                    </button>
                </form> */}
                <div className="p-map__filters" aria-label="お店のカテゴリ">
                    {categories.map((item) => (
                        <button
                            key={item}
                            type="button"
                            aria-pressed={category === item}
                            className={`c-map_filter ${category === item ? "is-active" : ""}`}
                            onClick={() => {
                                cancelRoute();
                                setCategory(item);
                                setSelected(null);
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                aria-hidden="true"
                            >
                                <use href={`${import.meta.env.BASE_URL}map_icons.svg#${categoryIcon(item)}`} />
                            </svg>
                            {item}
                        </button>
                    ))}
                </div>
                {routeStatus && (
                    <div className="p-map__notice" role="status">
                        {routeStatus.message}
                        <button type="button" onClick={cancelRoute}>ルートを閉じる</button>
                    </div>
                )}
                {statusMessage && (
                    <div className="p-map__notice" role="status">
                        {statusMessage}
                        {error && (
                            <button type="button" onClick={() => window.location.reload()}>
                                再読み込み
                            </button>
                        )}
                    </div>
                )}
            </div>
            <details className="p-map__discovery" inert={Boolean(selected)}>
                <summary>近くのお店 <span>{visibleShops.length}件</span></summary>
                <div className="p-map__shops">
                    {visibleShops.map((shop) => (
                        <button className="c-map_shop" key={shop.id} onClick={() => chooseShop(shop)} type="button">
                            <span className="c-map_shop__category">{shop.category}</span>
                            <h2>{shop.name}</h2>
                            <p>{shop.address}</p>
                        </button>
                    ))}
                </div>
            </details>
            <ShopBottomSheet shop={selected} onClose={() => { cancelRoute(); setSelected(null); }}
                onRoute={handleRoute} onCancelRoute={cancelRoute} routeStatus={routeStatus} />
            <BottomNav />
        </main>
    );
}
