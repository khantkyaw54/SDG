import { useEffect, useRef } from "react";

import {
    Map as MapLibreMap,
    Marker,
    Popup,
    NavigationControl,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);

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

        const shops = [
            {
                id: 1,
                name: "喫茶あさひ",
                category: "カフェ",
                lng: 136.8815,
                lat: 35.1709,
            },
            {
                id: 2,
                name: "洋食みなみ",
                category: "洋食",
                lng: 136.886,
                lat: 35.169,
            },
            {
                id: 3,
                name: "甘味処こはる",
                category: "和菓子",
                lng: 136.878,
                lat: 35.173,
            },
        ];

        shops.forEach((shop) => {
            const popup = new Popup({
                offset: 25,
            }).setHTML(`
        <div>
          <strong>${shop.name}</strong>
          <p>${shop.category}</p>
        </div>
      `);

            new Marker({
                color: "#e85d3f",
            })
                .setLngLat([shop.lng, shop.lat])
                .setPopup(popup)
                .addTo(map.current);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    return (
        <main className="map-page">
            <div
                ref={mapContainer}
                className="map-page__container"
            />
        </main>
    );
}