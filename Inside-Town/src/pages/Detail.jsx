import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ShopInfoTab from "../components/shop_info_tab";
import { Link } from "react-router-dom";
import { getShops } from "../data/shop_storage";

export default function Detail() {
  const { id } = useParams();
  const [shops] = useState(getShops);
  const navigate = useNavigate();

  const shop = shops.find((shop) => String(shop.id) === id);

  if (!shop) {
    return <main className="detail-page"><p>お店が見つかりません。</p><Link to="/map">地図に戻る</Link><BottomNav /></main>;
  }

  return (
    <main className="detail-page">
      <button onClick={() => navigate(-1)}>← 戻る</button>

      <p>{shop.category}</p>

      <h1>{shop.name}</h1>

      <ShopInfoTab shop={shop} />
      <p>{shop.description}</p>
      <Link className="c-flow_button" to={`/map?shop=${shop.id}`}>地図でお店を見る</Link>
      <BottomNav />
    </main>
  );
}
