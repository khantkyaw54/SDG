import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { shops } from "../data/shops";
import "../styles/_check_in.scss";

const shop = {
  ...shops[2],
  name: "こもれび菓子店",
  category: "カフェ・焼き菓子",
  address: "〒444-0825 愛知県岡崎市羽根町○○ 2-8-14",
  image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=700&q=85&fm=webp",
};

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
  const [cameraError, setCameraError] = useState("");
  const [scanStatus, setScanStatus] = useState("カメラを起動しています…");
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const completeRef = useRef(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const finishScan = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;
    stopCamera();
    setComplete(true);
  }, [stopCamera]);

  useEffect(() => {
    if (complete) return undefined;
    let cancelled = false;
    let scanTimer;
    let detector;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("このブラウザーではカメラを利用できません。HTTPS または localhost で開いてください。");
        return;
      }
      if (!("BarcodeDetector" in window)) {
        setCameraError("カメラは利用できますが、このブラウザーはQRコード読み取りに対応していません。Chrome または Android の対応ブラウザーでお試しください。");
      } else {
        try {
          const formats = await window.BarcodeDetector.getSupportedFormats();
          if (formats.includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          else setCameraError("このブラウザーのQRコード形式には対応していません。");
        } catch {
          setCameraError("QRコード読み取り機能を初期化できませんでした。");
        }
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1920 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanStatus(detector ? "QRコードを枠内に合わせてください" : "カメラ映像を表示中");
        }
        if (detector) {
          const scan = async () => {
            if (cancelled || completeRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length) {
                finishScan();
                return;
              }
            } catch {
              // Ignore transient camera frames and keep scanning.
            }
            scanTimer = window.setTimeout(scan, 250);
          };
          scan();
        }
      } catch (error) {
        if (cancelled) return;
        const message = error.name === "NotAllowedError"
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
      window.clearTimeout(scanTimer);
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
          <button className="check-in__simulate" type="button" onClick={finishScan}>スキャンをシミュレート</button>
        </>
      ) : (
        <section className="check-in__result" aria-live="polite">
          <button className="check-in__close" type="button" aria-label="閉じる" onClick={() => navigate(-1)}>×</button>
          <Celebration />
          <h1>来店チェックが完了しました！</h1>
          <article className="check-in__shop">
            <img src={shop.image} alt={`${shop.name}の店舗外観`} />
            <div>
              <h2>{shop.name}</h2>
              <p>{shop.category}</p>
              <address>{shop.address}</address>
            </div>
          </article>
          <Link className="check-in__review" to={`/detail/${shop.id}`}>口コミを書く</Link>
        </section>
      )}
      <BottomNav />
    </main>
  );
}
