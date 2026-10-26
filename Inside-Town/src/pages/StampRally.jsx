import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAccountFavorites } from "../hooks/use_account_favorites";
import { getShops } from "../data/shop_storage";
import { getRally, getRallyDraft, saveRally, saveRallyDraft } from "../data/account_activity";
import BottomNav from "../components/BottomNav";
import "../styles/_stamp_rally.scss";

const stages = ["intro", "region", "shops", "confirm", "progress", "complete"];
const cities = ["岡崎市", "名古屋市", "豊田市"];
const mapPoints = [[44, 25], [26, 62], [62, 69], [73, 32], [43, 46]];
const shopPhoto = "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=700&q=85&fm=webp";

function StampMark() {
  return <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="currentColor"/><circle cx="60" cy="60" r="43" fill="none" stroke="white" strokeWidth="3"/><path d="M60 34a12 12 0 0 0-12 12c0 9 12 20 12 20s12-11 12-20a12 12 0 0 0-12-12Z" fill="white"/><circle cx="60" cy="46" r="4" fill="currentColor"/><path d="M41 75h38v7H41zm6 11h26v5H47z" fill="white"/></svg>;
}

function RallyCelebration() {
  return <svg viewBox="0 0 300 220" role="img" aria-label="スタンプラリー達成のお祝い">
    <g strokeLinecap="round" strokeWidth="5">
      <path d="m34 45 7 8m-17 5 11-2m44-30 2 9m-9-2 8-3m153 23 8-8m-3 16 9-2m-29 105 8-5m-4 12 7-4m-144-8-7-8m17 4-9 2m182-75 8 5m-2-12 7 5" fill="none" stroke="#f0bd3f"/>
      <path d="m54 103-8-8m-3 12 8-4m46-77 4 8m114 132 7-7m-3 13 8-4m-161-27-7 3m187-92 7-6m-11-4 3 7" fill="none" stroke="#ef6557"/>
      <path d="m27 142 3-9m-9 5 8-1m219-74 4 8m-5 116 7-4m-164-3-4 8m102-152 2 8" fill="none" stroke="#36b8a6"/>
    </g>
    <path d="M150 26c9 0 13 10 21 13s19-1 25 6 2 18 6 26 15 12 15 21-10 14-13 22 1 19-6 26-18 2-26 6-12 15-22 15-14-10-22-13-19 1-26-6-2-18-6-26-15-12-15-22 10-14 13-22-1-19 6-26 18-2 26-6 12-14 24-14Z" fill="#39b29f"/>
    <circle cx="150" cy="105" r="55" fill="#2fa99a" stroke="#fff" strokeWidth="4"/>
    <circle cx="150" cy="105" r="47" fill="none" stroke="#fff" strokeWidth="3"/>
    <circle cx="150" cy="87" r="9" fill="#fff"/>
    <path d="M135 104c0-7 6-12 15-12s15 5 15 12v14h-30zm-10 18h50v7h-50z" fill="#fff"/>
  </svg>;
}

function CityMap({ shops, selectedIds, onToggle }) {
  return <div className="p-rally__map">
    <svg className="p-rally__map_art" viewBox="0 0 500 420" preserveAspectRatio="none" aria-hidden="true">
      <rect width="500" height="420" fill="#f4f6f2"/>
      <path d="M0 248 78 215l60 45-20 95-83 65H0Zm173-207 76 28-12 66-91 4-23-52Zm210 85 117-37v104l-91 21-41-38Zm-61 197 77-59 101 23v133H298Z" fill="#e2eedc"/>
      <path d="M-25 295c70-35 106-24 150 12s80 50 127 28 71-62 114-53 72 44 159 29" fill="none" stroke="#a9d7ec" strokeWidth="22"/>
      <g fill="none" stroke="#fff" strokeWidth="7">
        <path d="M-20 90 520 330M-30 180 510 45M8 0l370 430M135-10 8 430M290-15 165 435M445-10 310 430M-20 345 520 170"/>
        <path d="M-10 133 510 250M50-10 480 430M220-10 95 430M370-10 245 430"/>
      </g>
      <g fill="#8a9d80" fontFamily="sans-serif" fontSize="14"><text x="105" y="145">岡崎城</text><text x="315" y="180">岡崎公園</text><text x="385" y="290">東岡崎駅</text></g>
      <g fill="#dfe9dc"><path d="m112 128 9-18 9 18z"/><circle cx="330" cy="158" r="8"/></g>
    </svg>
    {shops.map((shop, index) => {
      const [left, top] = mapPoints[index % mapPoints.length];
      const active = selectedIds.includes(String(shop.id));
      return <button key={shop.id} className={`p-rally__map_pin ${active ? "is-selected" : ""}`} style={{ left: `${left}%`, top: `${top}%` }} onClick={() => onToggle(shop.id)} aria-label={`${shop.name}を${active ? "選択解除" : "選択"}`}>
        <span>{active ? selectedIds.indexOf(String(shop.id)) + 1 : ""}</span>
      </button>;
    })}
    <div className="p-rally__map_legend"><span><i className="is-picked" />選択済み</span><span><i />選択できます</span></div>
  </div>;
}

export default function StampRally() {
  const [params, setParams] = useSearchParams();
  const stage = stages.includes(params.get("step")) ? params.get("step") : "intro";
  const { profile } = useAccountFavorites();
  const navigate = useNavigate();
  const shops = useMemo(() => getShops(), []);
  const [draft, setDraft] = useState(() => getRallyDraft(profile?.id));
  const [selectionMode, setSelectionMode] = useState("map");
  const rally = getRally(profile?.id);
  const selectedIds = (draft.shopIds || []).map(String);
  const selected = selectedIds.map((id) => shops.find((shop) => String(shop.id) === id)).filter(Boolean);

  useEffect(() => {
    if (!profile) navigate("/auth?mode=login", { replace: true });
  }, [profile, navigate]);

  useEffect(() => {
    if (stage === "progress" && rally?.completed) setParams({ step: "complete" }, { replace: true });
  }, [stage, rally?.completed, setParams]);

  function go(next) { setParams({ step: next }); window.scrollTo(0, 0); }
  function back() {
    const previous = { region: "intro", shops: "region", confirm: "shops" }[stage];
    if (previous) go(previous);
    else navigate("/user");
  }
  function updateDraft(patch) {
    const next = { ...draft, ...patch };
    setDraft(next);
    saveRallyDraft(profile.id, next);
  }
  function toggleShop(id) {
    const value = String(id);
    const next = selectedIds.includes(value)
      ? selectedIds.filter((shopId) => shopId !== value)
      : selectedIds.length < 3 ? [...selectedIds, value] : selectedIds;
    updateDraft({ shopIds: next });
  }
  function start() {
    saveRally(profile.id, {
      prefecture: draft.prefecture || "愛知県",
      city: draft.city || "岡崎市",
      shopIds: selectedIds,
      stamps: [],
      completed: false,
      startedAt: new Date().toISOString(),
    });
    go("progress");
  }

  const title = `${rally?.prefecture || draft.prefecture || "愛知県"}${rally?.city || draft.city || "岡崎市"}`;
  const stampCount = rally?.stamps?.length || 0;
  const dateStart = rally?.startedAt ? new Date(rally.startedAt) : new Date();
  const dateEnd = new Date(dateStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  const formatDate = (date) => `${date.getMonth() + 1}月${date.getDate()}日`;

  return <main className={`p-rally p-rally--${stage}`}>
    {stage !== "complete" && <header><button type="button" onClick={back}>‹ <span>前のページに戻る</span></button></header>}

    {stage === "intro" && <section className="p-rally__intro">
      <h1>スタンプを集めて<br/>地域限定クーポンをもらおう</h1>
      <div className="p-rally__steps"><strong>スタンプラリーの始め方</strong><ol><li>地域を選ぼう</li><li>選んだ地域の中で3店舗選ぼう</li><li>実際に3店舗いって来店チェックをしよう</li><li>その地域でもらえるクーポンをプレゼント</li></ol></div>
      <p>はじめの店舗に来店してから一週間が立つと<br/>スタンプラリーが無効になります</p>
      <button className="p-rally__primary" onClick={() => go("region")}>スタンプラリーをはじめる</button>
    </section>}

    {stage === "region" && <section className="p-rally__region">
      <h1>スタンプラリーをする<br/>地域を選択してください</h1>
      <label className="p-rally__select_wrap"><span className="u-visually-hidden">都道府県</span><select value={draft.prefecture || "愛知県"} onChange={(event) => updateDraft({ prefecture: event.target.value })}><option>愛知県</option><option>岐阜県</option><option>三重県</option></select></label>
      <label className="p-rally__select_wrap"><span className="u-visually-hidden">市区町村</span><select value={draft.city || "岡崎市"} onChange={(event) => updateDraft({ city: event.target.value })}>{cities.map((city) => <option key={city}>{city}</option>)}</select></label>
      <button className="p-rally__primary" onClick={() => go("shops")}>次へ</button>
    </section>}

    {stage === "shops" && <section className="p-rally__shop_select">
      <h1>お店を3店舗選んでください</h1>
      <p className="p-rally__subhead">{draft.city || "岡崎市"}の対象店舗（全{shops.length}店舗）</p>
      <div className="p-rally__mode" role="tablist" aria-label="お店の選び方">
        <button role="tab" aria-selected={selectionMode === "map"} className={selectionMode === "map" ? "is-active" : ""} onClick={() => setSelectionMode("map")}>マップで選ぶ</button>
        <button role="tab" aria-selected={selectionMode === "list"} className={selectionMode === "list" ? "is-active" : ""} onClick={() => setSelectionMode("list")}>一覧から選ぶ</button>
      </div>
      {selectionMode === "map" ? <CityMap shops={shops} selectedIds={selectedIds} onToggle={toggleShop}/> :
        <div className="p-rally__shop_list">{shops.map((shop) => <button type="button" key={shop.id} className={selectedIds.includes(String(shop.id)) ? "is-selected" : ""} onClick={() => toggleShop(shop.id)}><span>{selectedIds.includes(String(shop.id)) ? selectedIds.indexOf(String(shop.id)) + 1 : "+"}</span><b>{shop.name}</b><small>{shop.category}</small></button>)}</div>}
      <div className="p-rally__selected"><p>選んだお店 <strong>{selected.length}/3</strong></p>{selected.map((shop) => <div key={shop.id}><span>{shop.name}</span><button type="button" aria-label={`${shop.name}の選択を解除`} onClick={() => toggleShop(shop.id)}>×</button></div>)}</div>
      <button className="p-rally__primary" disabled={selected.length !== 3} onClick={() => go("confirm")}>次へ</button>
    </section>}

    {stage === "confirm" && <section className="p-rally__confirm">
      <h1>{title}のスタンプラリー</h1>
      <div className="p-rally__confirm_list">{selected.map((shop) => <article key={shop.id}>
        <img src={shop.image || shop.imageUrl || shopPhoto} alt={`${shop.name}の店舗写真`} onError={(event) => { event.currentTarget.src = shopPhoto; }}/>
        <div><b>{shop.name}</b><small>{shop.category}</small><small>{shop.address}</small></div>
      </article>)}</div>
      <button className="p-rally__primary" disabled={selected.length !== 3} onClick={start}>この3店舗ではじめる</button>
    </section>}

    {stage === "progress" && <section className="p-rally__progress">
      <div className="p-rally__banner"><b>{rally?.city || "岡崎市"}のスタンプラリー</b><small>3店舗まわって、特典をもらおう</small></div>
      <p className="p-rally__period">期間：{formatDate(dateStart)} ～ {formatDate(dateEnd)}</p>
      <div className="p-rally__progress_bar"><span>{stampCount}/{rally?.shopIds?.length || 3}</span><div><i style={{ width: `${(stampCount / (rally?.shopIds?.length || 3)) * 100}%` }}/></div></div>
      <div className="p-rally__stamp_grid">{(rally?.shopIds || []).map((id, index) => {
        const shop = shops.find((item) => String(item.id) === String(id));
        const received = (rally?.stamps || []).map(String).includes(String(id));
        return <article key={id} className={received ? "is-received" : ""}>
          <span className="p-rally__stamp_icon">{received ? <StampMark/> : index + 1}</span><b>{shop?.name || "参加店舗"}</b><small>({shop?.category || "お店"})</small>{received && <time>{formatDate(new Date())}</time>}
        </article>;
      })}</div>
      <div className="p-rally__reward"><b>コンプリート特典</b><p>{rally?.city || "岡崎市"}で使える500円クーポン</p></div>
      <button className="p-rally__text_button" onClick={() => go("shops")}>お店を変更する</button>
      <button className="p-rally__cancel" onClick={() => { saveRally(profile.id, null); go("intro"); }}>スタンプラリーを中止する</button>
    </section>}

    {stage === "complete" && <section className="p-rally__done" aria-live="polite">
      <button className="p-rally__close" aria-label="閉じる" onClick={() => navigate("/user")}>×</button>
      <div className="p-rally__celebration"><RallyCelebration /></div>
      <h1>スタンプラリーが完了しました！</h1>
      <p>3店舗のご来店ありがとうございます。</p><p>{rally?.city || "岡崎市"}で使えるクーポンをプレゼントしました。</p>
      <Link className="p-rally__primary" to="/coupons">クーポンを確認する</Link>
    </section>}
    <BottomNav />
  </main>;
}
