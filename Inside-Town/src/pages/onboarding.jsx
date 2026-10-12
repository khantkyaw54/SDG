import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { completeRegistration, destination, readDraft, readProfile, saveDraft } from "../data/onboarding_storage";

const prefectures = "北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県".split(" ");
const citySuggestions = { 愛知県: ["岡崎市", "名古屋市", "豊田市", "豊橋市"], 東京都: ["新宿区", "渋谷区", "世田谷区"], 大阪府: ["大阪市", "堺市"], 神奈川県: ["横浜市", "川崎市"] };

function Frame({ children, back, teal = false, centered = false }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return (
    <main ref={heading} tabIndex={-1} className={`p-onboarding ${teal ? "p-onboarding--teal" : ""} ${centered ? "p-onboarding--centered" : ""}`}>
      {back && <Link className="p-onboarding__back" to={back}>‹ 前のページに戻る</Link>}
      <div className="p-onboarding__content">{children}</div>
    </main>
  );
}

export function StoryScreen({ step }) {
  const navigate = useNavigate();
  const next = step === "splash" ? "/intro" : step === "intro" ? "/auth" : step === "complete" ? "/guide" : destination(readProfile()?.role);
  useEffect(() => {
    if (step !== "splash" && step !== "intro") return;
    const timer = window.setTimeout(() => navigate(next, { replace: true }), step === "splash" ? 1600 : 3500);
    return () => window.clearTimeout(timer);
  }, [step, next, navigate]);
  return (
    <Frame teal centered>
      {step === "splash" && <h1 className="p-onboarding__logo">まちぐる</h1>}
      {step === "intro" && <h1 className="p-onboarding__story">その町のいいお店を<br />そこに住む人から教えてもらう。</h1>}
      {step === "complete" && <><h1 className="p-onboarding__story">町とのつながりができました！</h1><p className="p-onboarding__note">デモプロフィールの登録が完了しました。</p></>}
      {step === "guide" && <p className="p-onboarding__story">住んでいる町の<br />お店を探したり、<br />口コミを投稿したり。<br />全国の「そこに住む人」から、<br />おすすめのお店を<br />見つけてみましょう。</p>}
      <Link className="p-onboarding__continue" to={next}>{step === "guide" ? "まちぐるをはじめる →" : "次へ →"}</Link>
    </Frame>
  );
}

export function AuthScreen() {
  const [params] = useSearchParams();
  const login = params.get("mode") === "login";
  const profile = readProfile();
  return (
    <Frame centered back={login ? "/auth" : undefined}>
      <h1>{login ? "おかえりなさい" : "まちぐるをはじめよう"}</h1>
      <div className="p-onboarding__choices">
        {login ? <>
          <p className="p-onboarding__note">ログインは準備中です。{profile ? "このブラウザのデモプロフィールで続けられます。" : "新規登録からデモを体験できます。"}</p>
          {profile && <Link className="c-flow_button" to={destination(profile.role)}>デモを続ける</Link>}
          <Link className="c-flow_button" to="/role-select">新規登録</Link>
        </> : <>
          <Link className="c-flow_button" to="/role-select">新規登録</Link>
          <Link className="c-flow_button" to="/auth?mode=login">ログイン</Link>
        </>}
      </div>
    </Frame>
  );
}

export function RoleScreen() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  function choose(role) {
    try { saveDraft({ role }); navigate("/register"); }
    catch { setError("保存できません。ブラウザの保存設定をご確認ください。"); }
  }
  return (
    <Frame back="/auth">
      <h1>どのように街とつながる？</h1>
      <div className="p-onboarding__choices">
        {[["person", "個人"], ["shop", "店舗"], ["government", "行政"]].map(([role, label]) => <button className="c-flow_button" key={role} onClick={() => choose(role)}>{label}</button>)}
      </div>
      {error && <p role="alert" className="p-onboarding__note">{error}</p>}
    </Frame>
  );
}

export function RegistrationScreen({ step }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(readDraft);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);
  const [prefecture, setPrefecture] = useState(draft.prefecture || "愛知県");
  const [city, setCity] = useState(draft.city || "岡崎市");
  const titles = { register: "アカウントを作りましょう", verify: "本人確認をしましょう", "town-register": "今住んでいる町を教えてください", "town-verify": "町とのつながりを確認します", confirm: "あなたの町を確認しました" };
  const backs = { register: "/role-select", verify: "/register", "town-register": "/verify", "town-verify": "/town-register", confirm: "/town-verify" };
  if (step !== "register" && !draft.nickname) return <Navigate to="/register" replace />;
  if (["town-register", "town-verify", "confirm"].includes(step) && !draft.demoCodeAccepted) return <Navigate to="/verify" replace />;
  if (["town-verify", "confirm"].includes(step) && !draft.city) return <Navigate to="/town-register" replace />;
  if (step === "confirm" && !draft.demoTownAccepted) return <Navigate to="/town-verify" replace />;

  function advance(values, path) {
    try { saveDraft(values); setDraft({ ...draft, ...values }); navigate(path); }
    catch { setError("保存できません。ブラウザの保存設定をご確認ください。"); }
  }
  function submit(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    if (step === "register") {
      const nickname = form.get("nickname").trim();
      const contact = form.get("contact").trim();
      const phoneDigits = contact.replace(/\D/g, "");
      const validPhone = /^\+?[\d\s()-]+$/.test(contact) && phoneDigits.length >= 10 && phoneDigits.length <= 15;
      if (!nickname || !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || validPhone)) {
        setError("ニックネームと有効なメールアドレスまたは電話番号を入力してください。");
        return;
      }
      advance({ nickname, contact, demoCodeAccepted: false, demoTownAccepted: false }, "/verify");
    } else if (step === "verify") {
      if (code !== "123456") { setError("デモ用コード 123456 を入力してください。"); return; }
      advance({ demoCodeAccepted: true }, "/town-register");
    } else if (step === "town-register") {
      if (!city.trim()) { setError("市区町村を選択または入力してください。"); return; }
      advance({ prefecture, city: city.trim(), demoTownAccepted: false }, "/town-verify");
    } else if (step === "confirm") {
      try { completeRegistration(draft); navigate("/complete"); }
      catch { setError("登録内容を保存できませんでした。もう一度お試しください。"); }
    }
  }

  return (
    <Frame back={backs[step]}>
      <h1>{titles[step]}</h1>
      <form className="p-onboarding__form" onSubmit={submit}>
        {step === "register" && <>
          <label>ニックネーム<input name="nickname" autoComplete="nickname" defaultValue={draft.nickname || ""} required maxLength={30} /></label>
          <label>メールアドレス または 電話番号<input name="contact" autoComplete="username" defaultValue={draft.contact || ""} required maxLength={100} /></label>
          <p className="p-onboarding__note">画面体験用のデモです。実際のアカウントは作成されません。</p>
        </>}
        {step === "verify" && <>
          <p className="p-onboarding__note">確認コードを入力してください。<br />デモ用コード：123456（メール・SMSは送信されません）</p>
          <label className="p-onboarding__code_label">確認コード<input className="p-onboarding__code" aria-label="確認コード" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} placeholder="_ _ _ _ _ _" /></label>
        </>}
        {step === "town-register" && <>
          <p className="p-onboarding__note">住んでいる町を選択してください。<br />町の情報はデモプロフィールに保存されます。</p>
          <div className="p-onboarding__town_fields">
            <label>都道府県<select value={prefecture} onChange={(event) => { setPrefecture(event.target.value); setCity(""); }}>{prefectures.map((name) => <option key={name}>{name}</option>)}</select></label>
            <label>市区町村<input list="town-suggestions" value={city} onChange={(event) => setCity(event.target.value)} required maxLength={40} placeholder="選択・入力" autoComplete="address-level2" /><datalist id="town-suggestions">{(citySuggestions[prefecture] || []).map((name) => <option key={name} value={name} />)}</datalist></label>
          </div>
        </>}
        {step === "town-verify" && <>
          <p className="p-onboarding__note">町とのつながりを確認する画面のデモです。<br />カードの読み取りや本人確認は行いません。</p>
          <div className="p-onboarding__verification_card">
            <p>マイナンバーカードを<br />スマホにタッチしてください</p>
            <button className="c-flow_button c-flow_button--outline" type="button" onClick={() => advance({ demoTownAccepted: true }, "/confirm")}>デモで次に進む</button>
          </div>
        </>}
        {step === "confirm" && <>
          <p className="p-onboarding__note">登録する町（デモ・未認証）</p>
          <p className="p-onboarding__town_name">{draft.prefecture}{draft.city}</p>
        </>}
        {error && <p className="p-onboarding__error" role="alert">{error}</p>}
        {step !== "town-verify" && <button className="c-flow_button" type="submit">{step === "verify" ? "認証する" : step === "confirm" ? "登録する" : "次に進む"}</button>}
        {step === "verify" && <><button className="p-onboarding__text_button" type="button" onClick={() => setResent(true)}>コードを再送</button>{resent && <p className="p-onboarding__note" role="status">デモ用コードは 123456 です。送信は行われません。</p>}</>}
      </form>
    </Frame>
  );
}
