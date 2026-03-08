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
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <i className="fa-solid fa-house" />
          <span>Dashboard</span>
        </Link>

        {/* ========== ADMIN: 8 menu utama ========== */}
        {role === "ADMIN" && (
          <>
            <Link href="/permintaan" className={linkClass("/permintaan")}>
              <i className="fa-solid fa-clipboard-check" />
              <span>Permintaan Masuk</span>
            </Link>
            <Link href="/barang" className={linkClass("/barang")}>
              <i className="fa-solid fa-boxes-stacked" />
              <span>Barang</span>
            </Link>
            <Link href="/restock" className={linkClass("/restock")}>
              <i className="fa-solid fa-warehouse" />
              <span>Restock</span>
            </Link>
            <Link href="/log-stok" className={linkClass("/log-stok")}>
              <i className="fa-solid fa-history" />
              <span>Log Stok</span>
            </Link>
            <Link href="/users" className={linkClass("/users")}>
              <i className="fa-solid fa-users-gear" />
              <span>User & Role</span>
            </Link>
            <Link href="/laporan" className={linkClass("/laporan")}>
              <i className="fa-solid fa-chart-line" />
              <span>Laporan</span>
            </Link>
          </>
        )}

        {/* ========== STAFF: Dashboard, Katalog ATK, Permintaan Saya, Notifikasi, Profil ========== */}
        {role === "STAFF" && (
          <>
            <Link href="/barang" className={linkClass("/barang")}>
              <i className="fa-solid fa-box" />
              <span>Katalog ATK</span>
            </Link>
            <Link href="/permintaan" className={linkClass("/permintaan")}>
              <i className="fa-solid fa-clipboard-list" />
              <span>Permintaan Saya</span>
            </Link>
            <Link href="/notifikasi" className={linkClass("/notifikasi")}>
              <i className="fa-solid fa-bell" />
              <span>Notifikasi</span>
            </Link>
          </>
        )}

        {/* ========== PETUGAS: Tugas Aktif, Riwayat Tugas, Profil ========== */}
        {role === "PETUGAS" && (
          <>
            <Link href="/permintaan/tugas" className={linkClass("/permintaan/tugas")}>
              <i className="fa-solid fa-truck" />
              <span>Tugas Aktif</span>
            </Link>
            <Link href="/permintaan/riwayat" className={linkClass("/permintaan/riwayat")}>
              <i className="fa-solid fa-clock-rotate-left" />
              <span>Riwayat Tugas</span>
            </Link>
          </>
        )}

        <Link href="/profil" className={linkClass("/profil")}>
          <i className="fa-solid fa-user" />
          <span>Profil</span>
        </Link>
      </nav>
    </aside>
  );
}
