import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getShops } from "../data/shop_storage";

const genres = ["お食事", "スイーツ", "パン", "カフェ", "居酒屋", "ラーメン"];
const genreCategories = {
  お食事: ["お食事", "洋食", "和食", "中華", "レストラン"],
  スイーツ: ["スイーツ", "和菓子", "洋菓子"],
};

function SearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <use href={`${import.meta.env.BASE_URL}map_icons.svg#search`} />
    </svg>
  );
}

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [shops] = useState(getShops);
  const [keyword, setKeyword] = useState(params.get("q") || "");
  const [prefecture, setPrefecture] = useState(params.get("prefecture") ?? "愛知県");
  const [city, setCity] = useState(params.get("city") ?? "名古屋市");
  const [selected, setSelected] = useState(params.getAll("genre"));
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const resultsMode = params.get("results") === "1" && !editing;
  const extraGenres = [...new Set(["雑貨", "その他", ...shops.map((shop) => shop.category)])]
    .filter((genre) => !genres.includes(genre));
  const appliedGenres = params.getAll("genre");
  const results = shops.filter((shop) => {
    const text = `${shop.name} ${shop.category} ${shop.address} ${shop.description || ""}`.normalize("NFKC").toLowerCase();
    const words = (params.get("q") || "").normalize("NFKC").toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matchesArea = (!params.get("city") || shop.address.includes(params.get("city")))
      && (!params.get("prefecture") || shop.address.includes(params.get("prefecture")) || shop.address.startsWith("名古屋市"));
    return matchesArea && words.every((word) => text.includes(word))
      && (!appliedGenres.length || appliedGenres.some((genre) => (genreCategories[genre] || [genre]).includes(shop.category)));
  });

  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams({ results: "1", q: keyword.trim(), prefecture, city });
    selected.forEach((genre) => next.append("genre", genre));
    setParams(next);
    setEditing(false);
  }

  function toggleGenre(genre) {
    setSelected((current) => current.includes(genre)
      ? current.filter((item) => item !== genre)
      : [...current, genre]);
  }

  return (
    <main className="p-search">
      <div className="p-search__content">
        <h1 className="u-search_visually_hidden">{resultsMode ? "検索結果" : "検索ページ"}</h1>
        {resultsMode ? (
          <section aria-label="検索結果">
            <button className="p-search__summary" onClick={() => setEditing(true)} aria-label="検索条件を変更">
              <SearchIcon />
              <span>{[params.get("prefecture"), params.get("city"), params.get("q"), ...appliedGenres].filter(Boolean).join("　") || "すべてのお店"}</span>
            </button>
            <div className="p-search__results_header">
              <p role="status">{results.length.toLocaleString()}件</p>
              <button className="p-search__filter" onClick={() => setEditing(true)}>絞り込み <span aria-hidden="true">⌄</span></button>
            </div>
            <div className="p-search__results">
              {results.map((shop) => (
                <Link className="c-search_card" to={`/detail/${shop.id}`} key={shop.id}>
                  <span className="c-search_card__category">{shop.category}</span>
                  <h2>{shop.name}</h2>
                  <p>{shop.address}</p>
                  <span className="c-search_card__link">店舗情報を見る <span aria-hidden="true">→</span></span>
                </Link>
              ))}
              {!results.length && (
                <div className="p-search__empty">
                  <h2>お店が見つかりませんでした</h2>
                  <p>キーワードやジャンルを変えて、もう一度探してみてください。</p>
                  <button className="p-search__submit" onClick={() => setEditing(true)}>検索条件を変更する</button>
                </div>
              )}
            </div>
          </section>
        ) : (
          <form onSubmit={submit}>
            <label className="p-search__heading" htmlFor="search_keyword">気になるワードを入力</label>
            <div className="p-search__input">
              <SearchIcon />
              <input id="search_keyword" type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </div>
            <fieldset className="p-search__area">
              <legend className="p-search__heading">エリアを選択</legend>
              <div className="p-search__selects">
                <select aria-label="都道府県" value={prefecture} onChange={(event) => { setPrefecture(event.target.value); setCity(""); }}>
                  <option value="">すべての地域</option>
                  <option>愛知県</option>
                </select>
                <select aria-label="市区町村" value={city} onChange={(event) => setCity(event.target.value)}>
                  <option value="">すべての市区町村</option>
                  <option>名古屋市</option>
                </select>
              </div>
            </fieldset>
            <fieldset className="p-search__genres">
              <legend className="p-search__heading">ジャンルを選択</legend>
              <div className="p-search__genre_grid" id="search_genres">
                {[...genres, ...(expanded ? extraGenres : [])].map((genre) => (
                  <label className={`p-search__genre${selected.includes(genre) ? " is-selected" : ""}`} key={genre}>
                    <input type="checkbox" checked={selected.includes(genre)} onChange={() => toggleGenre(genre)} />
                    <span>{genre}</span>
                  </label>
                ))}
              </div>
              <button className="p-search__more" type="button" aria-expanded={expanded} aria-controls="search_genres" onClick={() => setExpanded(!expanded)}>
                {expanded ? "ジャンルを閉じる" : "すべてのジャンルを見る"}<span aria-hidden="true"> ›</span>
              </button>
            </fieldset>
            <button className="p-search__submit" type="submit">この条件でお店を探す</button>
          </form>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
