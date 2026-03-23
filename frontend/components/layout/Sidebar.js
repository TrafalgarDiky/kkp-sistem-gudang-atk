"use client";

/**
 * Sidebar — navigasi samping kiri per role.
 * Admin: 8 menu (Dashboard, Permintaan, Pengantaran, Barang, Restock, Log Stok, User & Role, Laporan) + Profil.
 * Staff: Katalog ATK, Permintaan Saya, Profil.
 * Petugas: Barang, Tugas, Profil.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const role = user?.role || "";

  const linkClass = (path) => {
    const isActive = pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
    return `sidebar-link ${isActive ? "active" : ""}`;
  };

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        {/* ========== ADMIN: menu dikelompokkan ========== */}
        {role === "ADMIN" && (
          <>
            <div className="sidebar-group-label">Dashboard</div>
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">Transaksi / Aktivitas</div>
            <Link href="/permintaan" className={linkClass("/permintaan")}>
              <i className="fa-solid fa-clipboard-check" />
              <span>Permintaan Masuk</span>
            </Link>
            <Link href="/restock" className={linkClass("/restock")}>
              <i className="fa-solid fa-warehouse" />
              <span>Restock</span>
            </Link>
            <Link href="/log-stok" className={linkClass("/log-stok")}>
              <i className="fa-solid fa-history" />
              <span>Log Stok</span>
            </Link>

            <div className="sidebar-group-label">Master Data</div>
            <Link href="/barang" className={linkClass("/barang")}>
              <i className="fa-solid fa-boxes-stacked" />
              <span>Barang</span>
            </Link>

            <div className="sidebar-group-label">Manajemen Pengguna</div>
            <Link href="/users" className={linkClass("/users")}>
              <i className="fa-solid fa-users-gear" />
              <span>User & Role</span>
            </Link>

            <div className="sidebar-group-label">Laporan</div>
            <Link href="/laporan" className={linkClass("/laporan")}>
              <i className="fa-solid fa-chart-line" />
              <span>Laporan</span>
            </Link>

            <div className="sidebar-group-label">Akun / Pengaturan</div>
            <Link href="/profil" className={linkClass("/profil")}>
              <i className="fa-solid fa-user" />
              <span>Profil</span>
            </Link>
          </>
        )}

        {/* ========== STAFF: Dashboard, Katalog ATK, Permintaan Saya, Notifikasi, Profil ========== */}
        {role === "STAFF" && (
          <>
            <div className="sidebar-group-label">Dashboard</div>
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">Katalog</div>
            <Link href="/barang" className={linkClass("/barang")}>
              <i className="fa-solid fa-box" />
              <span>Katalog ATK</span>
            </Link>

            <div className="sidebar-group-label">Transaksi</div>
            <Link href="/permintaan" className={linkClass("/permintaan")}>
              <i className="fa-solid fa-clipboard-list" />
              <span>Permintaan Saya</span>
            </Link>

            <div className="sidebar-group-label">Informasi</div>
            <Link href="/notifikasi" className={linkClass("/notifikasi")}>
              <i className="fa-solid fa-bell" />
              <span>Notifikasi</span>
            </Link>

            <div className="sidebar-group-label">Akun</div>
            <Link href="/profil" className={linkClass("/profil")}>
              <i className="fa-solid fa-user" />
              <span>Profil</span>
            </Link>
          </>
        )}

        {/* ========== PETUGAS: Tugas Aktif, Riwayat Tugas, Profil ========== */}
        {role === "PETUGAS" && (
          <>
            <div className="sidebar-group-label">Dashboard</div>
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">Transaksi</div>
            <Link href="/permintaan/tugas" className={linkClass("/permintaan/tugas")}>
              <i className="fa-solid fa-truck" />
              <span>Tugas Aktif</span>
            </Link>
            <Link href="/permintaan/riwayat" className={linkClass("/permintaan/riwayat")}>
              <i className="fa-solid fa-clock-rotate-left" />
              <span>Riwayat Tugas</span>
            </Link>

            <div className="sidebar-group-label">Akun</div>
            <Link href="/profil" className={linkClass("/profil")}>
              <i className="fa-solid fa-user" />
              <span>Profil</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
