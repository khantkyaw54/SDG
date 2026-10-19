import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import "../styles/_account_info.scss";

const content = {
  help: { title: "よくあるご質問・使い方", items: [["お店を探すには？", "マップで近くのお店を見たり、検索から地域やジャンルで探せます。"], ["来店チェックの方法は？", "来店チェック画面で店舗のQRコードを読み取ってください。"], ["スタンプラリーとは？", "対象のお店で来店チェックをしてスタンプを集めると、地域の特典を受け取れます。"]] },
  settings: { title: "設定", items: [["アカウント", "登録したプロフィール情報はこの端末に保存されています。"], ["プライバシー", "お気に入り、来店履歴、口コミ、クーポンはアカウントごとにこの端末へ保存されます。"]] },
};

export default function AccountInfo() {
  const { section } = useParams();
  const page = content[section] || content.help;
  return <main className="p-account-info"><h1>{page.title}</h1><Link className="p-account-info__back" to="/user">‹ マイページに戻る</Link><div>{page.items.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}</div><BottomNav /></main>;
}
