import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  apiKey,
  searchAddress,
} from "../utils/geoapify";

import {
  saveShop,
  getShops,
  deleteShop,
} from "../data/shop_storage";

import PortalLayout from "../components/portal_layout";


const storageKey = "inside_town_shop_draft";


const initialDraft = {
  name: "",
  category: "カフェ",
  address: "",
  hours: "",
  description: "",
};


function readDraft() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKey)
    );

    const draft = {
      ...initialDraft,
    };

    for (const key of Object.keys(draft)) {
      if (typeof saved?.[key] === "string") {
        draft[key] = saved[key];
      }
    }

    return draft;
  } catch {
    return {
      ...initialDraft,
    };
  }
}


export default function ShopPortal() {
  const [draft, setDraft] =
    useState(readDraft);

  const [status, setStatus] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const [candidate, setCandidate] =
    useState(null);

  const [savedId, setSavedId] =
    useState(null);

  const [shops, setShops] =
    useState(getShops);

  const request = useRef(null);


  useEffect(() => {
    return () => {
      request.current?.abort();
    };
  }, []);


  const handleChange = (event) => {
    request.current?.abort();

    setSearching(false);
    setCandidate(null);
    setSavedId(null);

    setDraft((currentDraft) => ({
      ...currentDraft,
      [event.target.name]:
        event.target.value,
    }));

    setStatus(
      "未保存の変更があります。"
    );
  };


  const saveDraft = (event) => {
    event.preventDefault();

    if (
      !draft.name.trim() ||
      !draft.address.trim()
    ) {
      setStatus(
        "店名と住所を入力してください。"
      );

      return;
    }

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(draft)
      );

      setStatus(
        "このブラウザに下書きを保存しました。"
      );
    } catch {
      setStatus(
        "保存できませんでした。ブラウザの保存設定を確認してください。"
      );
    }
  };


  // 住所をGeoapifyで検索
  const findShopAddress = async (event) => {
    if (
      event.nativeEvent.submitter?.value ===
      "draft"
    ) {
      saveDraft(event);
      return;
    }

    event.preventDefault();

    if (
      !draft.name.trim() ||
      !draft.address.trim()
    ) {
      setStatus(
        "店名と住所を入力してください。"
      );

      return;
    }

    if (!apiKey) {
      setStatus(
        "住所検索の設定がありません。"
      );

      return;
    }

    request.current?.abort();

    const controller =
      new AbortController();

    request.current = controller;

    setSearching(true);
    setCandidate(null);
    setSavedId(null);
    setStatus("");

    const timeout = setTimeout(
      () => controller.abort("timeout"),
      15000
    );

    try {
      const location =
        await searchAddress(
          draft.address,
          controller.signal
        );

      if (controller.signal.aborted) {
        return;
      }

      if (!location) {
        setStatus(
          "住所が見つかりませんでした。市区町村・番地まで入力してください。"
        );

        return;
      }

      setCandidate(location);

      setStatus(
        "見つかった住所を確認して、地図に追加してください。"
      );
    } catch {
      if (
        !controller.signal.aborted ||
        controller.signal.reason ===
        "timeout"
      ) {
        setStatus(
          "住所を検索できませんでした。もう一度お試しください。"
        );
      }
    } finally {
      clearTimeout(timeout);

      if (
        request.current === controller
      ) {
        setSearching(false);
      }
    }
  };


  // 店舗を保存
  const addShopToMap = () => {
    if (!candidate) return;

    try {
      const shop = saveShop({
        name:
          draft.name.trim(),

        category:
          draft.category,

        address:
          draft.address.trim(),

        hours:
          draft.hours.trim(),

        description:
          draft.description.trim(),

        lat:
          candidate.lat,

        lng:
          candidate.lng,
      });

      setSavedId(shop.id);

      setCandidate(null);

      // 一覧を更新
      setShops(getShops());

      // フォームをリセット
      setDraft({
        ...initialDraft,
      });

      // 下書きも削除
      localStorage.removeItem(
        storageKey
      );

      setStatus(
        "地図に追加しました。新しい店舗を続けて登録できます。"
      );
    } catch {
      setStatus(
        "店舗を保存できませんでした。"
      );
    }
  };


  // 登録店舗を削除
  const handleDelete = (id) => {
    const confirmed =
      window.confirm(
        "この店舗を削除しますか？"
      );

    if (!confirmed) return;

    try {
      deleteShop(id);

      setShops(getShops());

      if (savedId === id) {
        setSavedId(null);
      }

      setStatus(
        "店舗を削除しました。"
      );
    } catch {
      setStatus(
        "店舗を削除できませんでした。"
      );
    }
  };


  // ユーザーが追加した店舗だけ
  const registeredShops =
    shops.filter((shop) =>
      String(shop.id).startsWith(
        "local-"
      )
    );


  return (
    <PortalLayout
      kind="shop"
      title={
        <>
          あなたのお店の魅力を、
          <br />
          街の人へ。
        </>
      }
      description="お店の情報を整えて、まだ出会っていないお客さまへ。"
    >

      <div className="p-portal__grid">

        {/* 店舗登録フォーム */}
        <section className="c-portal_panel">

          <div className="c-portal_panel__heading">

            <div>
              <span>
                SHOP PROFILE
              </span>

              <h2>
                お店の情報
              </h2>
            </div>

            <span className="c-portal_badge">
              下書き
            </span>

          </div>


          <form
            className="c-portal_form"
            onSubmit={findShopAddress}
          >

            <label>
              店名 <span>必須</span>

              <input
                name="name"
                value={draft.name}
                onChange={handleChange}
                required
                maxLength={80}
                placeholder="例：路地裏珈琲店"
                autoComplete="organization"
              />
            </label>


            <label>
              カテゴリ

              <select
                name="category"
                value={draft.category}
                onChange={handleChange}
              >

                {[
                  "カフェ",
                  "洋食",
                  "和菓子",
                  "和食",
                  "雑貨",
                  "その他",
                ].map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}

              </select>
            </label>


            <label>
              住所 <span>必須</span>

              <input
                name="address"
                value={draft.address}
                onChange={handleChange}
                required
                maxLength={180}
                placeholder="例：名古屋市中村区…"
                autoComplete="street-address"
              />
            </label>


            <label>
              営業時間・定休日

              <input
                name="hours"
                value={draft.hours}
                onChange={handleChange}
                maxLength={120}
                placeholder="例：10:00〜18:00 / 水曜定休"
              />
            </label>


            <label>
              お店の紹介

              <textarea
                name="description"
                rows={4}
                value={draft.description}
                onChange={handleChange}
                maxLength={500}
                placeholder="こだわりの商品や、お店で過ごす時間について教えてください。"
              />

              <small>
                {draft.description.length}
                {" / 500文字"}
              </small>
            </label>


            <button
              className="c-portal_button"
              type="submit"
              value="locate"
              disabled={searching}
            >
              {searching
                ? "住所を検索しています…"
                : "住所を確認して地図に追加"}
            </button>


            <button
              className="
                c-portal_button
                c-portal_button--secondary
              "
              type="submit"
              value="draft"
              disabled={searching}
            >
              下書きだけ保存する
            </button>


            {candidate && (
              <div className="c-portal_location">

                <strong>
                  この住所で登録しますか？
                </strong>

                <p>
                  {candidate.formatted}
                </p>

                <p>
                  緯度{" "}
                  {candidate.lat.toFixed(5)}
                  {" / "}
                  経度{" "}
                  {candidate.lng.toFixed(5)}
                </p>


                <button
                  className="c-portal_button"
                  type="button"
                  onClick={addShopToMap}
                >
                  この位置で地図に追加
                </button>

              </div>
            )}


            {savedId && (
              <Link
                className="c-portal_map_link"
                to={`/map?shop=${encodeURIComponent(
                  savedId
                )}`}
              >
                追加したお店を地図で見る ↗
              </Link>
            )}


            <p
              className="c-portal_status"
              role="status"
            >
              {status}
            </p>

          </form>

        </section>



        {/* プレビュー */}
        <aside className="p-portal__aside">

          <section
            className="
              c-portal_panel
              c-portal_panel--preview
            "
          >

            <span className="c-portal_eyebrow">
              PREVIEW
            </span>


            <div
              className="c-portal_storefront"
              aria-hidden="true"
            >

              <svg
                viewBox="0 0 120 100"
                width="120"
                height="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  d="
                    M20 42v45h80V42
                    M14 42l10-24h72l10 24
                    M14 42q9 14 18 0
                    9 14 18 0
                    10 14 20 0
                    9 14 18 0
                    9 14 18 0
                    M48 87V60h24v27
                    M29 61h10v13H29z
                    M81 61h10v13H81z
                  "
                />
              </svg>

            </div>


            <span className="c-portal_badge">
              {draft.category}
            </span>


            <h2>
              {draft.name ||
                "あなたのお店"}
            </h2>


            <p>
              {draft.address ||
                "お店の住所が入ります"}
            </p>


            {draft.hours && (
              <p>
                {draft.hours}
              </p>
            )}


            <p className="c-portal_preview_text">
              {draft.description ||
                "お店の紹介文がここに表示されます。"}
            </p>

          </section>


          <section className="c-portal_tip">

            <h3>
              お店らしさが伝わる
              ひとことを。
            </h3>

            <p>
              人気の一品、店主のこだわり、
              心地よい席。
              あなたのお店ならではの
              魅力を書いてみましょう。
            </p>

          </section>

        </aside>

      </div>



      {/* 登録済み店舗 */}
      <section
        className="
          c-portal_panel
          c-portal_registered
        "
      >

        <div className="c-portal_panel__heading">

          <div>
            <span>
              REGISTERED SHOPS
            </span>

            <h2>
              登録したお店
            </h2>
          </div>

          <span className="c-portal_badge">
            {registeredShops.length}店舗
          </span>

        </div>


        {registeredShops.length > 0 ? (

          <ul className="c-portal_directory">

            {registeredShops.map(
              (shop) => (

                <li key={shop.id}>

                  <div>

                    <span className="c-portal_badge">
                      {shop.category}
                    </span>

                    <h3>
                      {shop.name}
                    </h3>

                    <p>
                      {shop.address}
                    </p>

                  </div>


                  <div className="c-portal_shop_actions">

                    <Link
                      to={`/detail/${shop.id}`}
                    >
                      詳細
                    </Link>


                    <button
                      type="button"
                      className="c-portal_delete"
                      onClick={() =>
                        handleDelete(
                          shop.id
                        )
                      }
                    >
                      削除
                    </button>

                  </div>

                </li>

              )
            )}

          </ul>

        ) : (

          <p className="c-portal_empty">
            登録したお店はまだありません。
          </p>

        )}

      </section>

    </PortalLayout>
  );
}