import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShops } from "../data/shop_storage";

export default function Detail() {
    const { id } = useParams();
    const [shops] = useState(getShops);
    const navigate = useNavigate();

    const shop = shops.find(
        (shop) => String(shop.id) === id
    );

    if (!shop) {
        return <p>お店が見つかりません。</p>;
    }

    return (
        <main className="detail-page">
            <button onClick={() => navigate(-1)}>
                ← 戻る
            </button>

            <p>{shop.category}</p>

            <h1>{shop.name}</h1>

            <p>{shop.address}</p>

            <p>{shop.hours}</p>
            <p>{shop.description}</p>
        </main>
    );
}