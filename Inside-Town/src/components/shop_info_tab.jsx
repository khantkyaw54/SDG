export default function ShopInfoTab({ shop }) {
  const items = [
    ["住所", shop.address],
    ["営業時間", shop.hours],
    ["定休日", shop.closedDays || shop.holiday],
    ["支払い方法", Array.isArray(shop.paymentMethods) ? shop.paymentMethods.join("、") : shop.paymentMethods || shop.payment],
  ];

  return (
    <dl className="c-shop_info">
      {items.map(([label, value]) => (
        <div className="c-shop_info__row" key={label}>
          <dt>{label}</dt>
          <dd>{value || "店舗にお問い合わせください"}</dd>
        </div>
      ))}
    </dl>
  );
}
