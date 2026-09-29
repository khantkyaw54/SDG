import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ShopInfoTab from "./shop_info_tab";
import ReviewsTab from "./reviews_tab";
import "../styles/_shop_bottom_sheet.scss";

const wishlistKey = "inside_town_wishlist";

export default function ShopBottomSheet({ shop, onClose }) {
  // Retain the last shop during the CSS exit transition.
  const [displayedShop, setDisplayedShop] = useState(shop);
  if (shop && shop !== displayedShop) setDisplayedShop(shop);

  return (
    <section className={`c-shop_sheet ${shop ? "is-open" : ""}`} inert={!shop} aria-hidden={!shop} aria-label="店舗情報">
      {displayedShop && <ShopContent key={displayedShop.id} shop={displayedShop} open={Boolean(shop)} onClose={onClose} />}
    </section>
  );
}

function ShopContent({ shop, open, onClose }) {
  const [tab, setTab] = useState("info");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(wishlistKey) || "[]").includes(String(shop.id)); }
    catch { return false; }
  });
  const closeButton = useRef(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    closeButton.current?.focus({ preventScroll: true });
    const escape = (event) => { if (event.key === "Escape") close.current(); };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);

  const toggleSaved = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
      const ids = Array.isArray(stored) ? stored : [];
      const next = saved ? ids.filter((id) => id !== String(shop.id)) : [...new Set([...ids, String(shop.id)])];
      localStorage.setItem(wishlistKey, JSON.stringify(next));
      setSaved(!saved);
      setMessage("");
    } catch { setMessage("保存できませんでした。ブラウザの保存設定をご確認ください。"); }
  };

  return (
    <>
      <div className="c-shop_sheet__handle" aria-hidden="true" />
      <button className="c-shop_sheet__back" type="button" onClick={onClose} aria-label="地図に戻る">‹</button>
      <button ref={closeButton} className="c-shop_sheet__close" type="button" onClick={onClose} aria-label="店舗情報を閉じる">×</button>
      <div className="c-shop_sheet__scroll">
        <header className="c-shop_sheet__intro">
          <div className="c-shop_sheet__photo">
            <img src={shop.image || shop.imageUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=85&fm=webp"} alt={shop.image || shop.imageUrl ? `${shop.name}の写真` : "カフェのイメージ写真"} onError={(event) => { event.currentTarget.style.display = "none"; }} />
            {!shop.image && !shop.imageUrl && <span>イメージ写真</span>}
          </div>
          <h1>{shop.name}</h1>
          <p className="c-shop_sheet__category">{shop.category}</p>
          <p className="c-shop_sheet__description">{shop.description || "いつもの街で出会う、地元の小さなお店。街歩きの途中に、立ち寄ってみませんか。"}</p>
        </header>
        <div className="c-shop_sheet__actions">
          <button type="button" className="c-shop_sheet__action" aria-pressed={saved} onClick={toggleSaved}>{saved ? "行ってみたいに保存済み ✓" : "行ってみたい"}</button>
          <button type="button" className="c-shop_sheet__action" onClick={() => setMessage("QRコードによる来店確認は準備中です。")}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden="true"><path d="M8 3 6 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-2-3H8Zm4 5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /></svg>
            <span>来店確認<small>QRコードを読み込む</small></span>
          </button>
          {message && <p className="c-shop_sheet__message" role="status">{message}</p>}
        </div>
        <div className="c-shop_sheet__tabs" role="tablist" aria-label="店舗の詳細">
          {[['info', '店舗情報'], ['reviews', '口コミ']].map(([id, label]) => (
            <button key={id} type="button" role="tab" id={`shop-tab-${id}`} aria-selected={tab === id} aria-controls="shop-tab-panel" tabIndex={tab === id ? 0 : -1} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const next = event.key === "Home" ? "info" : event.key === "End" ? "reviews" : tab === "info" ? "reviews" : "info";
                setTab(next);
                document.getElementById(`shop-tab-${next}`)?.focus();
              }
            }}>{label}</button>
          ))}
        </div>
        <div key={tab} id="shop-tab-panel" role="tabpanel" aria-labelledby={`shop-tab-${tab}`} className="c-shop_sheet__panel">
          {tab === "info" ? <ShopInfoTab shop={shop} /> : <ReviewsTab />}
        </div>
        <Link className="c-shop_sheet__detail" to={`/detail/${shop.id}`}>お店の詳細を見る →</Link>
      </div>
    </>
  );
}
