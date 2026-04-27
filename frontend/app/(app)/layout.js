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
  /** Desktop: mode sidebar icon-only (collapsed) */
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  /** Penanda viewport mobile agar ikon menu bisa kontekstual */
  const [isMobileViewport, setIsMobileViewport] = useState(false);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const syncViewport = (ev) => setIsMobileViewport(ev.matches);
    setIsMobileViewport(mq.matches);
    mq.addEventListener("change", syncViewport);
    return () => mq.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("sidebar:collapsed");
    setDesktopSidebarCollapsed(raw === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar:collapsed", desktopSidebarCollapsed ? "1" : "0");
  }, [desktopSidebarCollapsed]);

  const handleMenuClick = () => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      setMobileNavOpen((v) => !v);
      return;
    }
    setDesktopSidebarCollapsed((v) => !v);
  };

  return (
    <AuthGuard>
      <div className={`app-shell${desktopSidebarCollapsed ? " sidebar-collapsed" : ""}`}>
        <Header
          user={user}
          onMenuClick={handleMenuClick}
          menuOpen={mobileNavOpen}
          desktopCollapsed={desktopSidebarCollapsed}
          isMobileView={isMobileViewport}
        />
        <div className="app-body">
          <Sidebar
            user={user}
            mobileOpen={mobileNavOpen}
            collapsed={desktopSidebarCollapsed}
            onClose={() => setMobileNavOpen(false)}
          />
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
