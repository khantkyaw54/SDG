import { useParams, useNavigate } from "react-router-dom";
import { shops } from "../data/shops";

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const shop = shops.find(
        (shop) => shop.id === Number(id)
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

            <p>{shop.description}</p>
        </main>
    );
}