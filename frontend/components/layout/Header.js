"use client";

/**
 * Header / Topbar.
 * - Tombol menu: untuk buka/tutup sidebar (mobile + desktop collapse).
 * - Tombol profil: ikon user (tanpa inisial nama), dengan dropdown aksi.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

function toTs(v) {
  const d = new Date(v);
  const ts = d.getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function getNotifSeenKey(role) {
  return `notif:lastSeen:${role || "GUEST"}`;
}

function formatRelativeTime(ts) {
  if (!ts) return "Baru saja";
  const diff = Math.max(0, Date.now() - ts);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Baru saja";
  if (diff < hour) return `${Math.floor(diff / minute)} menit lalu`;
  if (diff < day) return `${Math.floor(diff / hour)} jam lalu`;
  return `${Math.floor(diff / day)} hari lalu`;
}

function getStaffNotifMessage(p) {
  if (p.statusAdmin === "DITOLAK_ADMIN") return "Permintaan ditolak admin.";
  if (p.statusAdmin === "SELESAI") return "Barang sudah diterima.";
  if (p.statusAdmin === "DISETUJUI_ADMIN") {
    if (p.tugasPetugas?.[0]?.petugas?.nama) return `Barang sedang diantar oleh ${p.tugasPetugas[0].petugas.nama}.`;
    return "Permintaan disetujui admin.";
  }
  return "Ada update permintaan.";
}

export default function Header({ user, onMenuClick, menuOpen, desktopCollapsed, isMobileView }) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifSeenTs, setNotifSeenTs] = useState(0);
  const notifWrapRef = useRef(null);
  const profileWrapRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(ev) {
      if (notifWrapRef.current && !notifWrapRef.current.contains(ev.target)) {
        setNotifOpen(false);
      }
      if (profileWrapRef.current && !profileWrapRef.current.contains(ev.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(getNotifSeenKey(user?.role));
    const n = Number(raw);
    setNotifSeenTs(Number.isFinite(n) ? n : 0);
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const setResult = (items) => {
      if (cancelled) return;
      const sorted = [...items].sort((a, b) => b.ts - a.ts);
      const unread = sorted.filter((it) => it.ts > notifSeenTs).length;
      setNotifItems(sorted.slice(0, 6));
      setNotifCount(unread);
    };

    async function fetchNotifStatus() {
      try {
        if (user?.role === "STAFF") {
          const res = await fetch(apiUrl("/api/permintaan"), { headers: getAuthHeaders() });
          const json = await res.json().catch(() => ({}));
          const list = json?.success ? json.data?.permintaan || [] : [];
          const items = list
            .filter((p) => ["DITOLAK_ADMIN", "DISETUJUI_ADMIN", "SELESAI"].includes(p?.statusAdmin))
            .map((p) => ({
              id: `staff-${p.id}`,
              icon: p.statusAdmin === "DITOLAK_ADMIN" ? "fa-circle-xmark" : "fa-circle-info",
              text: getStaffNotifMessage(p),
              href: "/permintaan",
              ts: toTs(p.updatedAt || p.createdAt),
              kind: "permintaan",
            }));
          setResult(items);
          return;
        }

        if (user?.role === "ADMIN") {
          const [resPermintaan, resUsers, resDashboard] = await Promise.all([
            fetch(apiUrl("/api/permintaan"), { headers: getAuthHeaders() }),
            fetch(apiUrl("/api/auth/users"), { headers: getAuthHeaders() }),
            fetch(apiUrl("/api/admin/dashboard"), { headers: getAuthHeaders() }),
          ]);

          const permintaanJson = await resPermintaan.json().catch(() => ({}));
          const usersJson = await resUsers.json().catch(() => ({}));
          const dashboardJson = await resDashboard.json().catch(() => ({}));

          const permintaanList = permintaanJson?.success ? permintaanJson.data?.permintaan || [] : [];
          const usersList = usersJson?.success ? usersJson.data?.users || [] : [];
          const stokMenipis = dashboardJson?.success ? dashboardJson.data?.stokMenipis || [] : [];

          const items = [
            ...permintaanList
              .filter((p) => p?.statusAdmin === "MENUNGGU_ADMIN")
              .map((p) => ({
                id: `admin-req-${p.id}`,
                icon: "fa-clipboard-check",
                text: "Ada permintaan barang baru menunggu persetujuan.",
                href: "/permintaan",
                ts: toTs(p.createdAt || p.updatedAt),
                kind: "permintaan-baru",
              })),
            ...usersList
              .filter((u) => u?.statusAkun === "BELUM_VERIFIKASI")
              .map((u) => ({
                id: `admin-user-${u.id}`,
                icon: "fa-user-check",
                text: `User baru "${u.nama || "Tanpa Nama"}" menunggu verifikasi.`,
                href: "/users",
                ts: toTs(u.createdAt || u.updatedAt),
                kind: "user-baru",
              })),
            ...stokMenipis.map((b) => ({
              id: `admin-stok-${b.id}`,
              icon: "fa-boxes-stacked",
              text: `Stok "${b.nama}" menipis (${b.stok}/${b.stokMinimum}).`,
              href: "/barang",
              ts: toTs(b.updatedAt || b.createdAt),
              kind: "stok-menipis",
            })),
          ];
          setResult(items);
          return;
        }

        if (user?.role === "PETUGAS") {
          const res = await fetch(apiUrl("/api/permintaan/tugas"), { headers: getAuthHeaders() });
          const json = await res.json().catch(() => ({}));
          const list = json?.success ? json.data?.tugas || [] : [];
          const items = list
            .filter((t) => t?.statusTugas === "MENUNGGU_ASSIGN" && !t?.petugasId)
            .map((t) => ({
              id: `petugas-${t.id}`,
              icon: "fa-truck",
              text: "Ada tugas pengantaran baru.",
              href: "/permintaan/tugas",
              ts: toTs(t.createdAt || t.updatedAt),
              kind: "tugas-baru",
            }));
          setResult(items);
          return;
        }

        if (!cancelled) {
          setNotifItems([]);
          setNotifCount(0);
        }
      } catch {
        // biarkan nilai terakhir agar tidak mengganggu render header
      }
    }

    fetchNotifStatus();
    intervalId = window.setInterval(fetchNotifStatus, 30_000);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [user?.role, notifSeenTs]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setProfileOpen(false);
    router.push("/login");
  };

  const markNotifSeenNow = () => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    localStorage.setItem(getNotifSeenKey(user?.role), String(now));
    setNotifSeenTs(now);
    setNotifCount(0);
  };

  const handleNotifToggle = () => {
    setProfileOpen(false);
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) markNotifSeenNow();
      return next;
    });
  };

  const notifListHref =
    user?.role === "PETUGAS" ? "/permintaan/tugas" : user?.role === "ADMIN" ? "/permintaan" : "/notifikasi";

  const menuIcon = isMobileView
    ? menuOpen
      ? "fa-xmark"
      : "fa-bars-staggered"
    : desktopCollapsed
      ? "fa-angles-right"
      : "fa-angles-left";

  const menuLabel = isMobileView
    ? menuOpen
      ? "Tutup menu navigasi"
      : "Buka menu navigasi"
    : desktopCollapsed
      ? "Perluas sidebar"
      : "Ringkas sidebar";

  const menuButtonClass = `app-menu-toggle ${isMobileView ? "is-mobile" : "is-desktop"}${
    menuOpen || !desktopCollapsed ? " is-active" : ""
  }`;

  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        {typeof onMenuClick === "function" && (
          <button
            type="button"
            className={menuButtonClass}
            onClick={onMenuClick}
            aria-label={menuLabel}
            aria-expanded={Boolean(menuOpen)}
          >
            <i className={`fa-solid ${menuIcon}`} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="app-topbar-right">
        <div className="app-notif" ref={notifWrapRef}>
          <button
            type="button"
            className={`app-notif-btn${notifCount > 0 ? " has-notif" : ""}`}
            aria-label="Buka notifikasi"
            title="Notifikasi"
            aria-expanded={notifOpen}
            onClick={handleNotifToggle}
          >
            <i className="fa-regular fa-bell" aria-hidden="true" />
            {notifCount > 0 && (
              <span className="app-notif-badge" aria-hidden="true">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="app-notif-dropdown">
              <div className="app-notif-head">
                <strong>Notifikasi</strong>
              </div>

              {notifItems.length === 0 ? (
                <p className="app-notif-empty">Belum ada notifikasi baru.</p>
              ) : (
                <div className="app-notif-list">
                  {notifItems.map((item) => (
                    <Link key={item.id} href={item.href} className="app-notif-item" onClick={() => setNotifOpen(false)}>
                      <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                      <span className="app-notif-item-content">
                        <span>{item.text}</span>
                        <small className="app-notif-item-time">{formatRelativeTime(item.ts)}</small>
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="app-user-dropdown-divider" />
              <Link href={notifListHref} className="app-notif-see-all" onClick={() => setNotifOpen(false)}>
                Lihat Semua
              </Link>
            </div>
          )}
        </div>

        <div className="app-user" ref={profileWrapRef}>
          <button
            type="button"
            className="app-user-trigger"
            aria-label="Menu profil"
            aria-expanded={profileOpen}
            onClick={() => {
              setNotifOpen(false);
              setProfileOpen((v) => !v);
            }}
          >
            <span className="app-user-icon" aria-hidden="true">
              <i className="fa-regular fa-user" />
            </span>
            <span className="app-user-meta">
              <span className="app-user-name">{user?.nama || "User"}</span>
              <span className="app-user-role">{user?.role || "Role"}</span>
            </span>
            <i className={`fa-solid fa-chevron-down app-user-caret${profileOpen ? " is-open" : ""}`} aria-hidden="true" />
          </button>

          {profileOpen && (
            <div className="app-user-dropdown">
              <Link href="/profil" className="app-user-item" onClick={() => setProfileOpen(false)}>
                <i className="fa-solid fa-user" aria-hidden="true" />
                <span>Profil Saya</span>
              </Link>
              <div className="app-user-dropdown-divider" />
              <button type="button" className="app-user-item danger" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
