import { useNavigate } from "react-router-dom";

export default function Select() {
    const navigate = useNavigate();

    return (
        <main className="select-page">
            <div className="select-container">
                <h1 className="select-title">Select User Type</h1>

                <button
                    className="select-btn"
                    onClick={() => navigate("/map")}
                >
                    個人
                </button>

                <button
                    className="select-btn"
                    onClick={() => alert("Coming Soon")}
                >
                    店舗
                </button>

                <button
                    className="select-btn"
                    onClick={() => alert("Coming Soon")}
                >
                    行政
                </button>
            </div>
        </main>
    );
}