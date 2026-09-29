const reviews = [
  "店内も落ち着いた雰囲気で、ゆっくり過ごせました。また行きたいです！",
  "お店の方が親切で、居心地がよかったです。街歩きの途中に立ち寄りたいお店です。",
];

export default function ReviewsTab() {
  return (
    <div className="c-shop_reviews">
      <p className="c-shop_reviews__note">口コミの表示サンプルです</p>
      {reviews.map((text, index) => (
        <article className="c-shop_reviews__item" key={text} aria-label={`サンプルの口コミ ${index + 1}`}>
          <span className="c-shop_reviews__avatar" aria-hidden="true" />
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}
