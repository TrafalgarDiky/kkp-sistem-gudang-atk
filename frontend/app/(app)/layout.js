"use client";

/**
 * Layout untuk halaman yang butuh login (dashboard, barang, permintaan, tugas).
 * (app) = route group — URL tetap /dashboard, /barang, dll.
 * Isi: AuthGuard (redirect ke login jika belum login) + Header + children.
 */
import { useEffect, useState } from "react";
import { AuthGuard, Header, Sidebar } from "@/components/layout";
import "../app-layout.css";

export default function AppLayout({ children }) {
  const [user, setUser] = useState(null);
  /** Drawer sidebar di layar sempit (HP) */
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 769px)");
    const closeOnWide = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener("change", closeOnWide);
    return () => mq.removeEventListener("change", closeOnWide);
  }, []);

  return (
    <AuthGuard>
      <div className="app-shell">
        <Header
          user={user}
          onMenuClick={() => setMobileNavOpen((v) => !v)}
          menuOpen={mobileNavOpen}
        />
        <div className="app-body">
          <Sidebar user={user} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
          <div className="app-main">{children}</div>
          <button
            type="button"
            className={`app-sidebar-backdrop${mobileNavOpen ? " is-visible" : ""}`}
            aria-label="Tutup menu"
            tabIndex={mobileNavOpen ? 0 : -1}
            onClick={() => setMobileNavOpen(false)}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
