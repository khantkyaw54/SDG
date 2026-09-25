import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { saveShop } from "../data/shop_storage";
import PortalLayout from "../components/portal_layout";

const storageKey = "inside_town_shop_draft";
const initialDraft = { name: "", category: "カフェ", address: "", hours: "", description: "", id: "" };
function readDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Object.fromEntries(Object.entries(initialDraft).map(([key, fallback]) => [key, typeof saved?.[key] === "string" ? saved[key] : fallback]));
  } catch { return initialDraft; }
}

export default function ShopPortal() {
  const [draft, setDraft] = useState(readDraft);
  const [status, setStatus] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const update = (event) => {
    request.current?.abort();
    setSearching(false);
    setCandidate(null);
    setSavedId(null);
    setDraft({ ...draft, [event.target.name]: event.target.value });
    setStatus("未保存の変更があります。");
  };
  const save = (event) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.address.trim()) {
      setStatus("店名と住所を入力してください。");
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setStatus("このブラウザに下書きを保存しました。");
    } catch { setStatus("保存できませんでした。ブラウザの保存設定を確認してください。"); }
  };
  const locate = async (event) => {
    if (event.nativeEvent.submitter?.value === "draft") { save(event); return; }
    event.preventDefault();
    if (!draft.name.trim() || !draft.address.trim()) { setStatus("店名と住所を入力してください。"); return; }
    const key = import.meta.env.VITE_GEOAPIFY_KEY?.trim();
    if (!key) { setStatus("住所検索の設定がありません。下書き保存をご利用ください。"); return; }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSearching(true); setCandidate(null); setSavedId(null); setStatus("");
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);
    try {
      const params = new URLSearchParams({ text: draft.address.trim(), lang: "ja", limit: "1", apiKey: key });
      const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Geocoding failed");
      const data = await response.json();
      if (controller.signal.aborted) return;
      const result = data.features?.[0];
      const [lng, lat] = result?.geometry?.coordinates || [];
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        setStatus("住所が見つかりませんでした。市区町村・番地まで入力してください。");
        return;
      }
      setCandidate({ lng, lat, formatted: result.properties?.formatted || draft.address });
      setStatus("見つかった住所を確認して、地図に追加してください。位置は住所から推定しています。");
    } catch {
      if (!controller.signal.aborted || controller.signal.reason === "timeout") setStatus("住所を検索できませんでした。通信環境や住所を確認して、もう一度お試しください。");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) setSearching(false);
    }
  };
  const register = () => {
    if (!candidate) return;
    try {
      const shop = saveShop({ ...draft, name: draft.name.trim(), address: draft.address.trim(), lat: candidate.lat, lng: candidate.lng });
      const nextDraft = { ...draft, id: shop.id };
      setDraft(nextDraft); setSavedId(shop.id); setCandidate(null);
      try { localStorage.setItem(storageKey, JSON.stringify(nextDraft)); } catch { /* The shop itself was saved successfully. */ }
      setStatus("地図に追加しました。このブラウザでマップと店舗詳細を確認できます。");
    } catch { setStatus("店舗を保存できませんでした。ブラウザの保存設定を確認してください。"); }
  };
  return (
    <PortalLayout kind="shop" title={<>あなたのお店の魅力を、<br />街の人へ。</>} description="お店の情報を整えて、まだ出会っていないお客さまへ。">
      <div className="p-portal__grid">
        <section className="c-portal_panel">
          <div className="c-portal_panel__heading"><div><span>SHOP PROFILE</span><h2>お店の情報</h2></div><span className="c-portal_badge">下書き</span></div>
          <form className="c-portal_form" onSubmit={locate}>
            <label>店名 <span>必須</span><input name="name" value={draft.name} onChange={update} required maxLength={80} placeholder="例：路地裏珈琲店" autoComplete="organization" /></label>
            <label>カテゴリ<select name="category" value={draft.category} onChange={update}>{["カフェ", "洋食", "和菓子", "和食", "雑貨", "その他"].map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>住所 <span>必須</span><input name="address" value={draft.address} onChange={update} required maxLength={180} placeholder="例：名古屋市中村区…" autoComplete="street-address" /></label>
            <label>営業時間・定休日<input name="hours" value={draft.hours} onChange={update} maxLength={120} placeholder="例：10:00〜18:00 / 水曜定休" /></label>
            <label>お店の紹介<textarea name="description" rows={4} value={draft.description} onChange={update} maxLength={500} placeholder="こだわりの商品や、お店で過ごす時間について教えてください。" /><small>{draft.description.length} / 500文字</small></label>
            <button className="c-portal_button" type="submit" value="locate" disabled={searching}>{searching ? "住所を検索しています…" : "住所を確認して地図に追加"}</button>
            <button className="c-portal_button c-portal_button--secondary" type="submit" value="draft" disabled={searching}>下書きだけ保存する</button>
            {candidate && <div className="c-portal_location"><strong>この住所で登録しますか？</strong><p>{candidate.formatted}</p><p>緯度 {candidate.lat.toFixed(5)} / 経度 {candidate.lng.toFixed(5)}</p><button className="c-portal_button" type="button" onClick={register}>この位置で地図に追加</button></div>}
            {savedId && <Link className="c-portal_map_link" to={`/map?shop=${encodeURIComponent(savedId)}`}>追加したお店を地図で見る ↗</Link>}
            <p className="c-portal_status" role="status">{status}</p>
          </form>
        </section>
        <aside className="p-portal__aside">
          <section className="c-portal_panel c-portal_panel--preview"><span className="c-portal_eyebrow">PREVIEW</span><div className="c-portal_storefront" aria-hidden="true"><svg viewBox="0 0 120 100" width="120" height="100" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 42v45h80V42M14 42l10-24h72l10 24M14 42q9 14 18 0 9 14 18 0 10 14 20 0 9 14 18 0 9 14 18 0M48 87V60h24v27M29 61h10v13H29zM81 61h10v13H81z" /></svg></div><span className="c-portal_badge">{draft.category}</span><h2>{draft.name || "あなたのお店"}</h2><p>{draft.address || "お店の住所が入ります"}</p>{draft.hours && <p>{draft.hours}</p>}<p className="c-portal_preview_text">{draft.description || "お店の紹介文がここに表示されます。"}</p></section>
          <section className="c-portal_tip"><h3>お店らしさが伝わるひとことを。</h3><p>人気の一品、店主のこだわり、心地よい席。あなたのお店ならではの魅力を書いてみましょう。</p></section>
        </aside>
      </div>
    </PortalLayout>
  );
}
