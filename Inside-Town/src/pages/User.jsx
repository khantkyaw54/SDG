import { useRef, useState } from "react";
import BottomNav from "../components/BottomNav";

const features = [
    { id: "heart", label: "行ってみたいお店", count: "0店舗", message: "行ってみたいお店はまだありません。" },
    { id: "pin", label: "行ったお店", count: "0店舗", message: "来店したお店はまだありません。" },
    { id: "review", label: "自分で書いた口コミ", count: "0件", message: "投稿した口コミはまだありません。" },
    { id: "ticket", label: "クーポン", count: "0枚", message: "利用できるクーポンはまだありません。" },
];

function Icon({ name }) {
    const paths = {
        heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
        pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
        review: <><path d="M5 3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-8l-6 4v-4a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" /><path d="M7 10h.01M12 10h.01M17 10h.01" /></>,
        ticket: <><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Z" /><path d="M14 5v3m0 3v2m0 3v3" /></>,
        camera: <><path d="M3 6h4l2-3h6l2 3h4v15H3V6Z" /><circle cx="12" cy="13" r="4" /></>,
    };
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function User() {
    const [profile, setProfile] = useState(null);
    const [panel, setPanel] = useState(null);
    const dialog = useRef(null);

    function openPanel(title, message, type) {
        setPanel({ title, message, type });
        dialog.current.showModal();
    }

    return (
        <main className="p-user">
            <h1 className="p-user__title">マイページ</h1>
            {profile ? (
                <div className="p-user__dashboard">
                    <div className="p-user__profile">
                        <span className="p-user__avatar" aria-hidden="true" />
                        <span>{profile}</span>
                    </div>
                    <button className="p-user__pill p-user__stamp" onClick={() => openPanel("スタンプラリー", "参加できるスタンプラリーはまだありません。")}>スタンプラリー</button>
                    <button className="p-user__checkin" onClick={() => openPanel("来店確認", "QRコードによる来店確認は準備中です。")}>
                        <span className="p-user__camera"><Icon name="camera" /></span>
                        <span>来店確認<small>QRコードを読み込む</small></span>
                    </button>
                    <div className="p-user__grid">
                        {features.map(({ id, label, count, message }) => (
                            <button key={id} className="p-user__card" onClick={() => openPanel(label, message)}>
                                <span className={`p-user__icon p-user__icon--${id}`}><Icon name={id} /></span>
                                <span>{label}</span><small>{count}</small>
                            </button>
                        ))}
                    </div>
                    <div className="p-user__links">
                        <button className="p-user__pill" onClick={() => openPanel("よくあるご質問・使い方", "「マップ」で近くのお店を探し、「検索」で気になるお店を見つけられます。アカウント登録・来店確認・口コミ・クーポンは準備中です。")}>よくあるご質問・使い方</button>
                        <button className="p-user__pill" onClick={() => openPanel("設定", "現在はマイページのプレビューを表示しています。", "settings")}>設定</button>
                    </div>
                </div>
            ) : (
                <div className="p-user__guest">
                    <button onClick={() => openPanel("新規登録", "アカウント登録は準備中です。表示名を入力してマイページをプレビューできます。", "preview")}>新規登録</button>
                    <button onClick={() => openPanel("ログイン", "ログインは準備中です。表示名を入力してマイページをプレビューできます。", "preview")}>ログイン</button>
                </div>
            )}
            <dialog className="c-user_dialog" ref={dialog}>
                <h2>{panel?.title}</h2>
                <p>{panel?.message}</p>
                {panel?.type === "preview" && (
                    <form onSubmit={(event) => {
                        event.preventDefault();
                        const name = new FormData(event.currentTarget).get("name").trim();
                        if (!name) return;
                        setProfile(name);
                        dialog.current.close();
                    }}>
                        <label htmlFor="profile_name">表示名</label>
                        <input id="profile_name" name="name" required maxLength={30} placeholder="例：佐藤 久美子" />
                        <button type="submit">プレビューを表示</button>
                    </form>
                )}
                {panel?.type === "settings" && <button onClick={() => { setProfile(null); dialog.current.close(); }}>プレビューを終了</button>}
                <button className="c-user_dialog__close" onClick={() => dialog.current.close()}>閉じる</button>
            </dialog>
            <BottomNav />
        </main>
    );
}
