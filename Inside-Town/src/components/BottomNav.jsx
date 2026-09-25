import { NavLink } from "react-router-dom";

const items = [
  { to: "/map", icon: "map", label: "マップ" },
  { to: "/search", icon: "search", label: "検索" },
  { to: "/user", icon: "user", label: "ユーザー" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      {items.map(({ to, icon, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav__item ${isActive ? "is-active" : ""}`}>
          <span className="bottom-nav__icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href={`/map_icons.svg#${icon}`} /></svg>
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
