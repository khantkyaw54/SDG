import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
    Map as MapLibreMap,
    Marker,
    Popup,
    NavigationControl,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";
import { shops } from "../data/shops";

export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (map.current) return;

        map.current = new MapLibreMap({
            container: mapContainer.current,

            style: {
                version: 8,
                sources: {
                    osm: {
                        type: "raster",
                        tiles: [
                            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                        ],
                        tileSize: 256,
                        attribution: "&copy; OpenStreetMap contributors",
                    },
                },
                layers: [
                    {
                        id: "osm",
                        type: "raster",
                        source: "osm",
                    },
                ],
            },

            center: [136.8815, 35.1709],
            zoom: 14,
        });

        map.current.addControl(
            new NavigationControl(),
            "top-right"
        );

        shops.forEach((shop) => {
            const popupContent = document.createElement("div");

            popupContent.className = "shop-popup";

            popupContent.innerHTML = `
        <strong>${shop.name}</strong>
        <p>${shop.category}</p>
        <p>${shop.address}</p>
        <button class="shop-popup__button">
          詳細を見る
        </button>
      `;

            popupContent
                .querySelector(".shop-popup__button")
                .addEventListener("click", () => {
                    navigate(`/detail/${shop.id}`);
                });

            const popup = new Popup({
                offset: 25,
            }).setDOMContent(popupContent);

            new Marker({
                color: "#e85d3f",
            })
                .setLngLat([shop.lng, shop.lat])
                .setPopup(popup)
                .addTo(map.current);
        });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLng = position.coords.longitude;
                const userLat = position.coords.latitude;

                map.current.flyTo({
                    center: [userLng, userLat],
                    zoom: 15,
                });

                new Marker({
                    color: "#2563eb",
                })
                    .setLngLat([userLng, userLat])
                    .setPopup(
                        new Popup().setHTML("<strong>現在地</strong>")
                    )
                    .addTo(map.current);
            },
            (error) => {
                console.error(error);
            }
        );

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [navigate]);

    return (
        <main className="map-page">
            <div
                ref={mapContainer}
                className="map-page__container"
            />
        </main>
    );
}