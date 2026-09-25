import { Link } from "react-router-dom";

export default function PortalLayout({ kind, title, description, children }) {
  return (
    <main className={`p-portal p-portal--${kind}`}>
      <header className="p-portal__header">
        <Link to="/select" className="p-portal__back">← 利用者を切り替える</Link>
        <span className="p-portal__wordmark">INSIDE TOWN</span>
      </header>
      <section className="p-portal__intro">
        <span className="c-portal_badge">{kind === "shop" ? "店舗の方へ" : "行政の方へ"}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <p className="p-portal__demo">{kind === "shop" ? "地図への追加はこのブラウザ内のみ有効です。住所の検索にはGeoapifyを利用します。" : "プレビュー版 · お知らせの下書きはこのブラウザにのみ保存され、公開・送信はされません。"}</p>
      {children}
      <footer className="p-portal__footer"><Link to="/map">街のマップを見る ↗</Link><span>街と、お店と、人をつなぐ。</span></footer>
    </main>
  );
}
