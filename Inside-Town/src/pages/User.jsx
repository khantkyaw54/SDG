import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAccountFavorites } from "../hooks/use_account_favorites";
import { getShops } from "../data/shop_storage";
import { removeFavorite } from "../data/favorites_storage";
import { getCoupons, getReviews, getVisitedShopIds } from "../data/account_activity";
import BottomNav from "../components/BottomNav";

const cards = [
  { id: "favorites", label: "行ってみたいお店" },
  { id: "visited", label: "行ったお店" },
  { id: "reviews", label: "自分で書いた口コミ" },
  { id: "coupons", label: "クーポン" },
];

function CardIcon({ name }) {
  const artwork = {
    favorites: <path d="M20.8 8.8c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />,
    visited: <><path className="is-filled" d="M12 21s7.5-7 7.5-12A7.5 7.5 0 0 0 4.5 9c0 5 7.5 12 7.5 12Z" /><circle className="is-cutout" cx="12" cy="9" r="2.2" /></>,
    reviews: <><path d="M5.2 4.5h13.6a2.7 2.7 0 0 1 2.7 2.7v8.3a2.7 2.7 0 0 1-2.7 2.7h-7.1l-5.2 3v-3h-1a2.7 2.7 0 0 1-2.7-2.7V7.2a2.7 2.7 0 0 1 2.4-2.7Z" /><circle className="is-dot" cx="8" cy="11.5" r=".7" /><circle className="is-dot" cx="12" cy="11.5" r=".7" /><circle className="is-dot" cx="16" cy="11.5" r=".7" /></>,
    coupons: <><path d="M3 7.5a2.5 2.5 0 0 0 0 5v4h18v-4a2.5 2.5 0 0 1 0-5v-4H3v4Z" /><path d="M14.5 3.5v2m0 2v2m0 2v2m0 2v2m0 2v1" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{artwork[name]}</svg>;
}

export default function User() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, favorites } = useAccountFavorites();
  const shops = useMemo(() => getShops(), []);
  const [section, setSection] = useState(null);
  const [revision, setRevision] = useState(0);
  const dialog = useRef(null);
  const visited = getVisitedShopIds(profile?.id);
  const reviews = getReviews(profile?.id);
  const coupons = getCoupons(profile?.id);
  const collection = {
    favorites: shops.filter((shop) => favorites.includes(String(shop.id))),
    visited: shops.filter((shop) => visited.includes(String(shop.id))),
    reviews,
    coupons,
  };
  const counts = { favorites: favorites.length, visited: visited.length, reviews: reviews.length, coupons: coupons.length };

  useEffect(() => {
    if (searchParams.get("open") !== "coupons" || !dialog.current || dialog.current.open) return;
    setSection("coupons");
    dialog.current.showModal();
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  function openSection(id) {
    setSection(id);
    dialog.current?.showModal();
  }

  function remove(shopId) {
    removeFavorite(profile.id, shopId);
    setRevision((value) => value + 1);
  }
  void revision;

  return (
    <main className="p-user">
      <h1 className="p-user__title">マイページ</h1>
      {profile ? (
        <div className="p-user__dashboard">
          <div className="p-user__profile">
            <span className="p-user__avatar" aria-hidden="true">{profile.nickname?.slice(0, 1)}</span>
            <span>{profile.nickname}</span>
          </div>
          <Link className="p-user__pill p-user__stamp" to="/stamp-rally">スタンプラリー</Link>
          <button className="p-user__checkin" onClick={() => navigate("/check-in")}>
            <span className="p-user__camera"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/></svg></span>
            <span>来店チェック<small>QRコードを読み込む</small></span>
          </button>
          <div className="p-user__grid">
            {cards.map(({ id, label }) => (
              <button key={id} className="p-user__card" onClick={() => id === "coupons" ? navigate("/coupons") : openSection(id)}>
                <span className={`p-user__icon p-user__icon--${id}`}><CardIcon name={id} /></span>
                <span>{label}</span><small>{counts[id]}{id === "favorites" || id === "visited" ? "店舗" : id === "coupons" ? "枚" : "件"}</small>
              </button>
            ))}
          </div>
          <div className="p-user__links">
            <Link className="p-user__pill" to="/account/help">よくあるご質問・使い方</Link>
            <Link className="p-user__pill" to="/account/settings">設定</Link>
          </div>
        </div>
      ) : (
        <div className="p-user__guest">
          <p>ログインしてマイページをご利用ください。</p>
          <button onClick={() => navigate("/role-select")}>新規登録</button>
          <button onClick={() => navigate("/auth?mode=login")}>ログイン</button>
        </div>
      )}
      <dialog className="c-user_dialog" ref={dialog}>
        <h2>{cards.find((card) => card.id === section)?.label}</h2>
        {collection[section]?.length ? <div className="p-user__collection">
          {collection[section].map((item, index) => {
            const shop = section === "favorites" || section === "visited" ? item : shops.find((entry) => String(entry.id) === String(item.shopId));
            return <article className="p-user__collection_item" key={item.id || item.shopId || shop?.id || index}>
              {shop ? <Link to={`/detail/${shop.id}`} onClick={() => dialog.current.close()}><strong>{shop.name}</strong><small>{shop.category} · {shop.address}</small></Link> : <div><strong>{item.title || item.name || (section === "reviews" ? "口コミ" : "クーポン")}</strong><small>{item.body || item.description || "詳細情報"}</small></div>}
              {section === "favorites" && <button type="button" onClick={() => remove(item.id)}>お気に入り解除</button>}
            </article>;
          })}
        </div> : <p>{section === "favorites" ? "行ってみたいお店はまだありません。" : section === "visited" ? "来店したお店はまだありません。" : section === "reviews" ? "投稿した口コミはまだありません。" : "利用できるクーポンはまだありません。"}</p>}
        <button className="c-user_dialog__close" onClick={() => dialog.current.close()}>閉じる</button>
      </dialog>
      <BottomNav />
    </main>
  );
}
