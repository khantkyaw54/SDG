import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getShops } from "../data/shop_storage";
import { readProfile } from "../data/onboarding_storage";
import { addVisitedShop, collectRallyStamp, getRally } from "../data/account_activity";
import "../styles/_check_in.scss";

const shops = getShops();
const fallbackShop = { ...shops[2], name: "こもれび菓子店", category: "カフェ・焼き菓子", address: "〒444-0825 愛知県岡崎市羽根町○○ 2-8-14", image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=700&q=85&fm=webp" };

function findScannedShop(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return null;
  const candidates = [raw];

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      candidates.push(parsed.shopId, parsed.shop_id, parsed.shop, parsed.id, parsed.name);
    }
  } catch { /* QR contents can also be plain text or a URL. */ }

  try {
    const url = new URL(raw);
    for (const key of ["shop", "shopId", "shop_id", "id"]) candidates.push(url.searchParams.get(key));
    const pathParts = url.pathname.split("/").filter(Boolean);
    candidates.push(pathParts.at(-1));
  } catch { /* Not a URL. */ }

  const tag = raw.match(/(?:shop(?:_id|Id)?[:=/])([\w-]+)/i);
  if (tag) candidates.push(tag[1]);

  return shops.find((shop) => candidates.some((candidate) => candidate != null && (
    String(shop.id).toLowerCase() === String(candidate).trim().toLowerCase() ||
    shop.name.trim().toLowerCase() === String(candidate).trim().toLowerCase()
  ))) || null;
}

function Celebration() {
  return (
    <svg className="check-in__celebration" viewBox="0 0 240 190" role="img" aria-label="来店チェックをお祝いするイラスト">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="m33 42 6 7m-9 4 8-1m117-25-6 8m11 1 6-4m-19 125 4-8m-14 10 8-2M54 139l-5-7m-6 12 8-2" stroke="#e9c46a" strokeWidth="4" />
        <path d="m75 25 3 8m-8 0 7-2m103 88 7 3m-3-9-2 8" stroke="#e87954" strokeWidth="4" />
        <circle cx="120" cy="90" r="54" fill="#2fa99a" stroke="#248e82" strokeWidth="3" />
        <circle cx="120" cy="90" r="44" stroke="#fff" strokeWidth="3" />
        <path d="M94 80h48v15a24 24 0 0 1-48 0V80Zm48 4h7a10 10 0 0 1 0 20h-9M97 121h45m-26-56v8m-11-10 2 8m20-8-2 8" fill="#fff" stroke="#fff" strokeWidth="4" />
      </g>
    </svg>
  );
}

export default function CheckIn() {
  const [complete, setComplete] = useState(false);
  const [rallyCompleted, setRallyCompleted] = useState(false);
  const [scannedShop, setScannedShop] = useState(fallbackShop);
  const [cameraError, setCameraError] = useState("");
  const [scanStatus, setScanStatus] = useState("カメラを起動しています…");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedShopId = searchParams.get("shop");
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const completeRef = useRef(false);

  const stopCamera = useCallback(() => {
    scannerRef.current?.stop();
    scannerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const finishScan = useCallback((shop) => {
    if (completeRef.current) return;
    const user = readProfile();
    const rally = getRally(user?.id);
    const nextRallyShopId = rally?.shopIds?.find((id) => !(rally.stamps || []).map(String).includes(String(id)));
    const resolvedShop = shop || shops.find((item) => String(item.id) === String(requestedShopId || nextRallyShopId)) || fallbackShop;
    setScannedShop(resolvedShop);
    completeRef.current = true;
    stopCamera();
    if (user) {
      addVisitedShop(user.id, resolvedShop.id);
      collectRallyStamp(user.id, resolvedShop.id);
      setRallyCompleted(Boolean(getRally(user.id)?.completed));
    }
    setComplete(true);
  }, [requestedShopId, stopCamera]);

  useEffect(() => {
    if (complete) return undefined;
    let cancelled = false;
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("このブラウザーではカメラを利用できません。HTTPS または localhost で開いてください。");
        return;
      }
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1920 } },
        }, videoRef.current, (result, _error, activeControls) => {
          if (activeControls) scannerRef.current = activeControls;
          if (cancelled || completeRef.current || !result) return;
          const matchedShop = findScannedShop(result.getText());
          if (matchedShop) finishScan(matchedShop);
          else setScanStatus("このQRコードのお店は見つかりませんでした");
        });
        scannerRef.current = controls;
        if (cancelled) controls.stop();
        else setScanStatus("QRコードを枠内に合わせてください");
      } catch (error) {
        if (cancelled) return;
        const message = error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
          ? "カメラの使用が許可されていません。ブラウザーの設定でカメラを許可してください。"
          : error.name === "NotFoundError"
            ? "利用できるカメラが見つかりませんでした。"
            : "カメラを起動できませんでした。カメラの設定をご確認ください。";
        setCameraError(message);
        setScanStatus("");
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [complete, finishScan, stopCamera]);

  return (
    <main className={`check-in ${complete ? "is-complete" : ""}`}>
      {!complete ? (
        <>
          <div className="check-in__camera" aria-label="カメラプレビュー">
            <video ref={videoRef} className="check-in__video" autoPlay playsInline muted />
            <div className="check-in__viewfinder" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
            <p className="check-in__instruction">{scanStatus || cameraError}</p>
            {cameraError && <p className="check-in__error" role="status">{cameraError}</p>}
          </div>
          <button className="check-in__simulate" type="button" onClick={() => finishScan(findScannedShop(requestedShopId))}>スキャンをシミュレート</button>
        </>
      ) : (
        <section className="check-in__result" aria-live="polite">
          <button className="check-in__close" type="button" aria-label="閉じる" onClick={() => rallyCompleted ? navigate("/stamp-rally?step=complete", { replace: true }) : navigate(-1)}>×</button>
          <Celebration />
          <h1>来店チェックが完了しました！</h1>
          <article className="check-in__shop">
            <img src={scannedShop.image || fallbackShop.image} alt={`${scannedShop.name}の店舗外観`} />
            <div>
              <h2>{scannedShop.name}</h2>
              <p>{scannedShop.category}</p>
              <address>{scannedShop.address}</address>
            </div>
          </article>
          <Link className="check-in__review" to={`/detail/${scannedShop.id}`}>口コミを書く</Link>
        </section>
      )}
      <BottomNav />
    </main>
  );
}
