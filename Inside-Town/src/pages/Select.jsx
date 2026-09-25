import { useNavigate } from "react-router-dom";

export default function Select() {
    const navigate = useNavigate();

    return (
        <main className="select-page">
            <div className="select-container">
                <h1 className="select-title">どの立場で街とつながりますか？</h1>

                <button
                    className="select-btn"
                    onClick={() => navigate("/map")}
                >
                    個人
                </button>

                <button
                    className="select-btn"
                    onClick={() => navigate("/shop")}
                >
                    店舗
                </button>

                <button
                    className="select-btn"
                    onClick={() => navigate("/government")}
                >
                    行政
                </button>
            </div>
        </main>
    );
}