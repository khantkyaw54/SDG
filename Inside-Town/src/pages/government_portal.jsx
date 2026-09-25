import { useState } from "react";
import { Link } from "react-router-dom";
import PortalLayout from "../components/portal_layout";
import { getShops } from "../data/shop_storage";

const storageKey = "inside_town_community_drafts";
function readDrafts() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(saved) ? saved.filter((item) => typeof item?.id === "string" && typeof item.title === "string" && typeof item.body === "string" && typeof item.date === "string") : [];
  } catch { return []; }
}

export default function GovernmentPortal() {
  const [shops] = useState(getShops);
  const [filter, setFilter] = useState("すべて");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState(readDrafts);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const categories = [...new Set(shops.map((shop) => shop.category))];
  const visibleShops = shops.filter((shop) => (filter === "すべて" || shop.category === filter) && `${shop.name} ${shop.address}`.includes(query.trim()));
  const save = (event) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) { setStatus("タイトルと本文を入力してください。"); return; }
    const next = [{ id: crypto.randomUUID(), title: title.trim(), body: body.trim(), date: new Date().toLocaleDateString("ja-JP") }, ...drafts];
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setDrafts(next); setTitle(""); setBody(""); setStatus("お知らせの下書きを保存しました。公開はされていません。");
    } catch { setStatus("保存できませんでした。入力内容を控えて、ブラウザの保存設定を確認してください。"); }
  };
  return (
    <PortalLayout kind="government" title={<>街の魅力を知り、<br />地域のつながりを育む。</>} description="地域のお店を見渡して、街からのお知らせを準備しましょう。">
      <section className="p-portal__stats" aria-label="掲載データの概要"><div><span>掲載店舗</span><strong>{shops.length}<small>店舗</small></strong></div><div><span>カテゴリ</span><strong>{categories.length}<small>種類</small></strong></div><div><span>お知らせの下書き</span><strong>{drafts.length}<small>件</small></strong></div></section>
      <div className="p-portal__grid">
        <section className="c-portal_panel"><div className="c-portal_panel__heading"><div><span>LOCAL DIRECTORY</span><h2>地域のお店</h2></div><span className="c-portal_badge">サンプル・追加店舗</span></div>
          <div className="c-portal_form c-portal_form--filter"><label>店名・住所で検索<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="店名やエリアを入力" /></label><label>カテゴリ<select value={filter} onChange={(event) => setFilter(event.target.value)}>{["すべて", ...categories].map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <p className="c-portal_result" role="status">{visibleShops.length}件のお店</p>
          <ul className="c-portal_directory">{visibleShops.map((shop) => <li key={shop.id}><div><span className="c-portal_badge">{shop.category}</span><h3>{shop.name}</h3><p>{shop.address}</p></div><Link to={`/detail/${shop.id}`} aria-label={`${shop.name}の詳細を見る`}>詳細 ↗</Link></li>)}</ul>
          {!visibleShops.length && <p className="c-portal_empty">条件に一致するお店がありません。検索条件を変更してください。</p>}
        </section>
        <section className="c-portal_panel"><div className="c-portal_panel__heading"><div><span>COMMUNITY NEWS</span><h2>街のお知らせ</h2></div></div>
          <form className="c-portal_form" onSubmit={save}><label>タイトル <span>必須</span><input value={title} onChange={(event) => { setTitle(event.target.value); setStatus(""); }} required maxLength={100} placeholder="例：秋の商店街イベントのお知らせ" /></label><label>本文 <span>必須</span><textarea value={body} onChange={(event) => { setBody(event.target.value); setStatus(""); }} required rows={5} maxLength={2000} placeholder="日時、場所、参加方法などを入力してください。" /></label><button className="c-portal_button" type="submit">下書きを保存する</button><p className="c-portal_status" role="status">{status}</p></form>
          <div className="c-portal_drafts"><h3>保存した下書き</h3>{drafts.length ? drafts.map((draft) => <article key={draft.id}><span>{draft.date} · 未公開</span><h4>{draft.title}</h4><p>{draft.body}</p></article>) : <p className="c-portal_empty">下書きはまだありません。</p>}</div>
        </section>
      </div>
    </PortalLayout>
  );
}
