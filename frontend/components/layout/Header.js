"use client";

/**
 * Header / Topbar — logo + nama user.
 * Layout sama untuk semua role.
 */
import Link from "next/link";

export default function Header({ user, onMenuClick, menuOpen }) {
  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        {typeof onMenuClick === "function" && (
          <button
            type="button"
            className="app-menu-toggle"
            onClick={onMenuClick}
            aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={Boolean(menuOpen)}
          >
            <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
          </button>
        )}
        <Link href="/dashboard" className="app-logo">
          <span className="app-logo-mark" aria-hidden="true">
            <i className="fa-solid fa-box-open" />
          </span>
          <span className="app-logo-brand">GATK</span>
        </Link>
      </div>

      <div className="app-topbar-right">
        <div className="app-user">
          <span className="app-user-name">{user?.nama || "User"}</span>
          <span className="app-user-role-badge">{user?.role || ""}</span>
        </div>
      </div>
    </header>
  );
}
