# Inside Town

地元の個人店を探す、スマホ中心のアプリです。React・SCSS・Geoapify を使っています。

## 起動する

```sh
npm install
npm run dev
```

`.env` に `VITE_GEOAPIFY_KEY` を設定します。書き方は `.env.example` を見てください。

```sh
npm run build  # 本番用にビルド
npm run lint   # JavaScript のチェック
```

## 最初に読むファイル

| やりたいこと                       | 編集するファイル                  |
| ---------------------------------- | --------------------------------- |
| ページの URL を変える              | `src/App.jsx`                     |
| 個人・店舗・行政の選択画面を変える | `src/pages/Select.jsx`            |
| 地図の検索欄や店舗カードを変える   | `src/pages/Map.jsx`               |
| 地図の色・ピン・表示位置を変える   | `src/utils/map_helpers.js`        |
| Geoapify の住所検索を変える        | `src/utils/geoapify.js`           |
| 店舗の入力フォームを変える         | `src/pages/shop_portal.jsx`       |
| 行政の店舗一覧・お知らせを変える   | `src/pages/government_portal.jsx` |
| 店舗詳細を変える                   | `src/pages/Detail.jsx`            |
| サンプル店舗を変える               | `src/data/shops.js`               |
| 店舗の保存・読み込みを変える       | `src/data/shop_storage.js`        |
| 共通の色を変える                   | `src/styles/_variables.scss`      |
| 共通・開始画面の見た目を変える     | `src/styles/_base.scss`           |
| 地図の見た目を変える               | `src/styles/_map.scss`            |
| 店舗・行政ページの見た目を変える   | `src/styles/_portal.scss`         |

`src/styles/style.scss` はスタイルを読み込む入口です。

## ページのコードの読み方

ページは基本的に上から次の順番です。

1. **import**: 使う部品や関数を読み込む。
2. **useState**: 入力内容や選択中の店舗など、画面の状態を持つ。
3. **イベント関数**: ボタンを押したときの処理を書く。
4. **return**: 画面の HTML に近い JSX を書く。

地図では追加で `useRef` に MapLibre の地図を保持し、`useEffect` で地図の作成と片付けをします。
通信を中止する処理は、ページを離れた後に古い結果が表示されるのを防ぎます。

## 店舗を追加して地図に表示する流れ

1. 店舗ページで店名と住所を入力。
2. `findShopAddress` が `searchAddress` を呼び、住所を緯度・経度に変換。
3. 住所を確認し、「この位置で地図に追加」を押す。
4. `addShopToMap` が `saveShop` を呼び、ブラウザに保存。
5. 地図と詳細ページが `getShops` でサンプル店舗と追加店舗を読み込む。
6. `/map?shop=店舗ID` のリンクから、追加店舗のピンを表示。

下書き保存と地図への追加は別の処理です。
データは `localStorage` に保存するため、同じブラウザ・同じURLでのみ使えます。
`localhost` と `127.0.0.1` は別の保存先です。まだサーバーへの公開機能はありません。
