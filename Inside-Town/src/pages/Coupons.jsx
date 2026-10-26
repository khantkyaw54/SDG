import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getCoupons, markCouponUsed } from "../data/account_activity";
import { readProfile } from "../data/onboarding_storage";

const conditions = [
  "岡崎市内の対象飲食店でご利用いただけます。",
  "1回のお会計につき500円分の割引となります。",
  "おつりは出ません。現金への交換もできません。",
  "他の割引・クーポンとの併用はできません。",
  "お会計前に店舗スタッフへご提示ください。",
  "有効期限を過ぎるとご利用いただけません。",
];

function couponTitle(coupon) {
  return coupon.title || `${coupon.city || "岡崎市"} 地域応援お食事クーポン 500円分`;
}

function couponCity(coupon) {
  return coupon.city || coupon.title?.match(/(岡崎市|名古屋市|豊田市)/)?.[1] || "岡崎市";
}

function periodText(start, end) {
  const format = (date) => `${date.getMonth() + 1}月${date.getDate()}日（${"日月火水木金土"[date.getDay()]}）`;
  return `${format(start)} ～ ${format(end)}`;
}

function usedText(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "利用済み";
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function Coupons() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("available");
  const [confirming, setConfirming] = useState(false);
  const profile = readProfile();
  const profileId = profile?.id;
  const [coupons, setCoupons] = useState(() => getCoupons(profileId));
  const couponId = params.get("coupon");
  const coupon = useMemo(() => coupons.find((item) => String(item.id) === String(couponId)), [coupons, couponId]);
  const available = coupons.filter((item) => !item.usedAt);
  const used = coupons.filter((item) => item.usedAt);
  const displayedCoupons = tab === "used" ? used : available;

  useEffect(() => {
    if (!profileId) navigate("/auth?mode=login", { replace: true });
  }, [profileId, navigate]);

  useEffect(() => {
    const refresh = () => setCoupons(getCoupons(profileId));
    window.addEventListener("inside-town-account-change", refresh);
    return () => window.removeEventListener("inside-town-account-change", refresh);
  }, [profileId]);

  function openCoupon(item) {
    setConfirming(false);
    setParams({ coupon: String(item.id) });
    window.scrollTo(0, 0);
  }

  function back() {
    if (confirming) {
      setConfirming(false);
      return;
    }
    if (couponId) {
      setParams({});
      return;
    }
    navigate(-1);
  }

  function useCoupon() {
    const updated = markCouponUsed(profileId, coupon?.id);
    if (updated) setCoupons((current) => current.map((item) => String(item.id) === String(updated.id) ? updated : item));
    setConfirming(false);
  }

  const defaultStart = new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 6 * 86400000);
  const period = periodText(coupon?.validFrom ? new Date(coupon.validFrom) : defaultStart, coupon?.validUntil ? new Date(coupon.validUntil) : defaultEnd);

  return <main className={`p-coupons ${coupon ? "p-coupons--detail" : "p-coupons--list"}`}>
    <button className="p-coupons__back" type="button" onClick={back}>‹ <span>前のページに戻る</span></button>
    {coupon ? (
      <section className="p-coupons__detail">
        <h1>獲得クーポン</h1>
        <article className="p-coupons__ticket">
          <span className="p-coupons__city">{couponCity(coupon)}</span>
          <p className="p-coupons__name">{couponTitle(coupon)}</p>
          <small>有効期限</small>
          <p className="p-coupons__period">{period}</p>
          {coupon.usedAt ? (
            <div className="p-coupons__used"><strong>利用済み</strong><small>{usedText(coupon.usedAt)}</small></div>
          ) : confirming ? (
            <div className="p-coupons__confirm">
              <strong>本当に使いますか</strong>
              <small>お使いになる前に必ず注意事項をご確認ください。「使う」をタップすると取り消しできません。</small>
              <button className="p-coupons__use" type="button" onClick={useCoupon}>使う</button>
              <button className="p-coupons__later" type="button" onClick={() => setConfirming(false)}>今は使わない</button>
            </div>
          ) : (
            <button className="p-coupons__use" type="button" onClick={() => setConfirming(true)}>使う</button>
          )}
          <div className="p-coupons__conditions"><strong>注意事項</strong><ul>{conditions.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </article>
      </section>
    ) : (
      <section className="p-coupons__list">
        <div className="p-coupons__tabs" role="tablist" aria-label="クーポンの種類">
          <button type="button" role="tab" aria-selected={tab === "available"} className={tab === "available" ? "is-active" : ""} onClick={() => setTab("available")}>獲得クーポン</button>
          <button type="button" role="tab" aria-selected={tab === "used"} className={tab === "used" ? "is-active" : ""} onClick={() => setTab("used")}>利用済み</button>
        </div>
        {displayedCoupons.length ? <div className="p-coupons__items">{displayedCoupons.map((item) => (
          <button key={item.id} type="button" className="p-coupons__item" onClick={() => openCoupon(item)}>
            <span className="p-coupons__city">{couponCity(item)}</span>
            <span className="p-coupons__item_title">{couponTitle(item)}</span>
            <small>{item.usedAt ? `利用日：${usedText(item.usedAt)}` : `期間：${periodText(item.validFrom ? new Date(item.validFrom) : defaultStart, item.validUntil ? new Date(item.validUntil) : defaultEnd)}`}</small>
            <b>{item.usedAt ? "表示" : "表示"}</b>
          </button>
        ))}</div> : <p className="p-coupons__empty">{tab === "used" ? "利用済みのクーポンはありません。" : "獲得したクーポンはまだありません。"}</p>}
      </section>
    )}
    <BottomNav />
  </main>;
}
