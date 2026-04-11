"use client";

/**
 * Sidebar — navigasi samping kiri per role.
 * Admin: 8 menu (Dashboard, Permintaan, Pengantaran, Barang, Restock, Log Stok, User & Role, Laporan) + Profil.
 * Staff: Katalog ATK, Permintaan Saya, Profil.
 * Petugas: Barang, Tugas, Profil.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ user, mobileOpen, onClose }) {
  const pathname = usePathname();
  const role = user?.role || "";

  const linkClass = (path) => {
    const isActive = pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
    return `sidebar-link ${isActive ? "active" : ""}`;
  };

  const handleNav = () => {
    if (typeof onClose === "function") onClose();
  };

  return (
    <aside className={`app-sidebar${mobileOpen ? " is-open" : ""}`} id="app-sidebar-nav">
      <nav className="sidebar-nav">
        {/* ========== ADMIN: menu dikelompokkan ========== */}
        {role === "ADMIN" && (
          <>
            <div className="sidebar-group-label">Dashboard</div>
            <Link href="/dashboard" className={linkClass("/dashboard")} onClick={handleNav}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">Transaksi / Aktivitas</div>
            <Link href="/permintaan" className={linkClass("/permintaan")} onClick={handleNav}>
              <i className="fa-solid fa-clipboard-check" />
              <span>Permintaan Masuk</span>
            </Link>
            <Link href="/restock" className={linkClass("/restock")} onClick={handleNav}>
              <i className="fa-solid fa-warehouse" />
              <span>Restock</span>
            </Link>
            <Link href="/log-stok" className={linkClass("/log-stok")} onClick={handleNav}>
              <i className="fa-solid fa-history" />
              <span>Log Stok</span>
            </Link>

            <div className="sidebar-group-label">Master Data</div>
            <Link href="/barang" className={linkClass("/barang")} onClick={handleNav}>
              <i className="fa-solid fa-boxes-stacked" />
              <span>Barang</span>
            </Link>

            <div className="sidebar-group-label">Manajemen Pengguna</div>
            <Link href="/users" className={linkClass("/users")} onClick={handleNav}>
              <i className="fa-solid fa-users-gear" />
              <span>User & Role</span>
            </Link>

            <div className="sidebar-group-label">Laporan</div>
            <Link href="/laporan" className={linkClass("/laporan")} onClick={handleNav}>
              <i className="fa-solid fa-chart-line" />
              <span>Laporan</span>
            </Link>

            <div className="sidebar-group-label">Akun / Pengaturan</div>
            <Link href="/profil" className={linkClass("/profil")} onClick={handleNav}>
              <i className="fa-solid fa-user" />
              <span>Profil</span>
            </Link>
          </>
        )}

        {/* ========== STAFF: Dashboard, Katalog ATK, Permintaan Saya, Notifikasi, Profil ========== */}
        {role === "STAFF" && (
          <>
            <div className="sidebar-group-label">Dashboard</div>
            <Link href="/dashboard" className={linkClass("/dashboard")} onClick={handleNav}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">Katalog</div>
            <Link href="/barang" className={linkClass("/barang")} onClick={handleNav}>
              <i className="fa-solid fa-box" />
              <span>Katalog ATK</span>
            </Link>

            <div className="sidebar-group-label">Transaksi</div>
            <Link href="/permintaan" className={linkClass("/permintaan")} onClick={handleNav}>
              <i className="fa-solid fa-clipboard-list" />
              <span>Permintaan Saya</span>
            </Link>

            <div className="sidebar-group-label">Informasi</div>
            <Link href="/notifikasi" className={linkClass("/notifikasi")} onClick={handleNav}>
              <i className="fa-solid fa-bell" />
              <span>Notifikasi</span>
            </Link>

            <div className="sidebar-group-label">Akun</div>
            <Link href="/profil" className={linkClass("/profil")} onClick={handleNav}>
              <i className="fa-solid fa-user" />
              <span>Profil</span>
            </Link>
          </>
        )}

        {/* ========== PETUGAS: Tugas Aktif, Riwayat Tugas, Profil ========== */}
        {role === "PETUGAS" && (
          <>
            <div className="sidebar-group-label">Dashboard</div>
            <Link href="/dashboard" className={linkClass("/dashboard")} onClick={handleNav}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">Transaksi</div>
            <Link href="/permintaan/tugas" className={linkClass("/permintaan/tugas")} onClick={handleNav}>
              <i className="fa-solid fa-truck" />
              <span>Tugas Aktif</span>
            </Link>
            <Link href="/permintaan/riwayat" className={linkClass("/permintaan/riwayat")} onClick={handleNav}>
              <i className="fa-solid fa-clock-rotate-left" />
              <span>Riwayat Tugas</span>
            </Link>

            <div className="sidebar-group-label">Akun</div>
            <Link href="/profil" className={linkClass("/profil")} onClick={handleNav}>
              <i className="fa-solid fa-user" />
              <span>Profil</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
