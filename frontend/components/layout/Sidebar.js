"use client";

/**
 * Sidebar — navigasi samping kiri per role.
 *
 * Struktur (per role):
 * - ADMIN:
 *     UTAMA              : Dashboard
 *     MASTER DATA        : Stok Barang
 *     TRANSAKSI          : Barang Masuk, Barang Keluar
 *     OPERASIONAL        : Permintaan ATK/Barang, Monitoring Petugas
 *     RIWAYAT & LAPORAN  : Log Stok, Cetak Laporan
 *     ADMINISTRASI       : Manajemen User
 *
 * Catatan:
 * - Halaman /pengeluaran & /permintaan/buat (untuk admin) sengaja TIDAK
 *   ditampilkan di sidebar admin. Alasannya:
 *     /pengeluaran      -> overlap dengan Log Stok + Laporan
 *     /permintaan/buat  -> admin yang approve, jadi tidak perlu mengajukan ke dirinya sendiri
 *   Halaman tetap ada (tidak dihapus) untuk keperluan link lama / bookmark.
 * - STAFF:
 *     UTAMA       : Dashboard
 *     OPERASIONAL : Minta Barang, Riwayat Permintaan Barang
 *     PENGATURAN  : Profil
 *     ---         : Log Out
 * - PETUGAS:
 *     UTAMA       : Dashboard
 *     OPERASIONAL : Minta Barang, Daftar Tugas, Riwayat Tugas
 *     PENGATURAN  : Profil
 *     ---         : Log Out
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

function safeDate(v) {
  try {
    const d = new Date(v);
    // invalid date -> NaN
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function getSeenKey(role, kind) {
  return `seen:${role}:${kind}`;
}

function getSeenTs(role, kind) {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(getSeenKey(role, kind));
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function markSeenNow(role, kind) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getSeenKey(role, kind), String(Date.now()));
}

function Badge({ count, variant = "primary", title }) {
  if (!count) return null;
  const colors =
    variant === "danger"
      ? { bg: "#fee2e2", border: "#fecaca", fg: "#b91c1c" }
      : { bg: "#ede9fe", border: "#ddd6fe", fg: "#6d28d9" };
  return (
    <span
      className="sidebar-badge"
      title={title}
      style={{
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 22,
        height: 18,
        padding: "0 6px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.fg,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Sidebar({ user, mobileOpen, collapsed, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = user?.role || "";

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    if (typeof onClose === "function") onClose();
    router.push("/login");
  };

  /**
   * Badge notif (client-side) untuk sidebar.
   *
   * Apa tujuan bagian ini?
   * - Menampilkan badge jumlah "baru" di menu tertentu (Permintaan Masuk / Daftar Tugas).
   *
   * Apa input?
   * - Data dari API + timestamp "terakhir dilihat" yang disimpan di localStorage.
   *
   * Apa output?
   * - Angka badge yang hilang setelah menu dibuka/diklik.
   *
   * Kenapa pakai cara ini?
   * - Sederhana untuk MVP: tidak butuh websocket / push notif.
   */
  const [adminNotif, setAdminNotif] = useState({ masukBaru: 0, ditolakBaru: 0 });
  const [petugasNotif, setPetugasNotif] = useState({ tugasBaru: 0 });

  /**
   * Apa tujuan bagian ini?
   * - Menentukan link sidebar mana yang sedang aktif.
   *
   * Apa input?
   * - `path` tujuan link, `opts.exact` (opsional) untuk memaksa cocok persis.
   *
   * Apa output?
   * - String className: "sidebar-link" atau "sidebar-link active".
   *
   * Kenapa pakai cara ini?
   * - Menghindari bug "aktif ganda" saat ada route turunan.
   *   Contoh: `/permintaan` dan `/permintaan/buat` — kalau pakai startsWith biasa, dua-duanya aktif.
   */
  const linkClass = (path, opts = {}) => {
    const exact = Boolean(opts.exact);
    const isActive = exact
      ? pathname === path
      : pathname === path || (path !== "/dashboard" && pathname.startsWith(path + "/"));
    return `sidebar-link ${isActive ? "active" : ""}`;
  };

  const handleNav = () => {
    if (typeof onClose === "function") onClose();
  };

  // Saat user membuka halaman terkait, tandai sebagai "sudah dilihat"
  useEffect(() => {
    if (role === "ADMIN") {
      if (pathname === "/permintaan") {
        markSeenNow("ADMIN", "permintaan_masuk");
        markSeenNow("ADMIN", "permintaan_ditolak");
        setAdminNotif({ masukBaru: 0, ditolakBaru: 0 });
      }
    }
    if (role === "PETUGAS") {
      if (pathname === "/permintaan/tugas") {
        markSeenNow("PETUGAS", "tugas");
        setPetugasNotif({ tugasBaru: 0 });
      }
    }
  }, [pathname, role]);

  // Fetch notif counts (poll ringan sekali saat sidebar render / role berubah)
  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    async function fetchAdminBadges() {
      const seenMasuk = getSeenTs("ADMIN", "permintaan_masuk");
      const seenTolak = getSeenTs("ADMIN", "permintaan_ditolak");
      try {
        const [resMasuk, resTolak] = await Promise.all([
          fetch(apiUrl("/api/permintaan?status=DISETUJUI_ADMIN"), { headers: getAuthHeaders() }),
          fetch(apiUrl("/api/permintaan?status=DITOLAK_ADMIN"), { headers: getAuthHeaders() }),
        ]);
        const jMasuk = await resMasuk.json().catch(() => ({}));
        const jTolak = await resTolak.json().catch(() => ({}));
        const listMasuk = jMasuk?.success ? jMasuk.data?.permintaan || [] : [];
        const listTolak = jTolak?.success ? jTolak.data?.permintaan || [] : [];

        const masukBaru = listMasuk.filter((p) => {
          const d = safeDate(p?.createdAt);
          return d ? d.getTime() > seenMasuk : false;
        }).length;
        const ditolakBaru = listTolak.filter((p) => {
          const d = safeDate(p?.updatedAt || p?.createdAt);
          return d ? d.getTime() > seenTolak : false;
        }).length;

        if (!cancelled) setAdminNotif({ masukBaru, ditolakBaru });
      } catch {
        // diam saja: badge tidak mengganggu fungsi utama
      }
    }

    async function fetchPetugasBadges() {
      const seenTugas = getSeenTs("PETUGAS", "tugas");
      try {
        const res = await fetch(apiUrl("/api/permintaan/tugas"), { headers: getAuthHeaders() });
        const j = await res.json().catch(() => ({}));
        const list = j?.success ? j.data?.tugas || [] : [];
        const tugasBaru = list.filter((t) => {
          // definisi "tugas baru": belum diambil siapa pun + status menunggu
          const isNew = t?.statusTugas === "MENUNGGU_ASSIGN" && !t?.petugasId;
          if (!isNew) return false;
          const d = safeDate(t?.createdAt);
          return d ? d.getTime() > seenTugas : false;
        }).length;
        if (!cancelled) setPetugasNotif({ tugasBaru });
      } catch {
        // diam saja
      }
    }

    if (role === "ADMIN") fetchAdminBadges();
    if (role === "PETUGAS") fetchPetugasBadges();

    /**
     * Polling ringan agar badge update tanpa refresh.
     * Interval dibuat tidak terlalu sering supaya tidak membebani API.
     */
    if (role === "ADMIN" || role === "PETUGAS") {
      intervalId = window.setInterval(() => {
        if (cancelled) return;
        if (role === "ADMIN") fetchAdminBadges();
        if (role === "PETUGAS") fetchPetugasBadges();
      }, 25_000);
    }

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [role]);

  const permintaanBadge = useMemo(() => {
    if (role !== "ADMIN") return null;
    return { masukBaru: adminNotif.masukBaru, ditolakBaru: adminNotif.ditolakBaru };
  }, [role, adminNotif]);

  const tugasBadge = useMemo(() => {
    if (role !== "PETUGAS") return null;
    return { tugasBaru: petugasNotif.tugasBaru };
  }, [role, petugasNotif]);

  return (
    <aside
      className={`app-sidebar${mobileOpen ? " is-open" : ""}${collapsed ? " is-collapsed" : ""}`}
      id="app-sidebar-nav"
    >
      <nav className="sidebar-nav">
        {/* ========== ADMIN: menu dikelompokkan ========== */}
        {role === "ADMIN" && (
          <>
            <div className="sidebar-group-label">UTAMA</div>
            <Link href="/dashboard" className={linkClass("/dashboard")} onClick={handleNav}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">MASTER DATA</div>
            <Link href="/barang" className={linkClass("/barang")} onClick={handleNav}>
              <i className="fa-solid fa-boxes-stacked" />
              <span>Stok Barang</span>
            </Link>

            <div className="sidebar-group-label">TRANSAKSI</div>
            <Link href="/restock" className={linkClass("/restock")} onClick={handleNav}>
              <i className="fa-solid fa-truck-ramp-box" />
              <span>Barang Masuk</span>
            </Link>
            <Link href="/pengeluaran" className={linkClass("/pengeluaran")} onClick={handleNav}>
              <i className="fa-solid fa-truck-arrow-right" />
              <span>Barang Keluar</span>
            </Link>

            <div className="sidebar-group-label">OPERASIONAL</div>
            <Link
              href="/permintaan"
              className={linkClass("/permintaan", { exact: true })}
              onClick={() => {
                markSeenNow("ADMIN", "permintaan_masuk");
                markSeenNow("ADMIN", "permintaan_ditolak");
                setAdminNotif({ masukBaru: 0, ditolakBaru: 0 });
                handleNav();
              }}
            >
              <i className="fa-solid fa-clipboard-check" />
              <span>Permintaan Barang</span>
              <Badge count={permintaanBadge?.masukBaru} title="Permintaan baru" />
              <Badge count={permintaanBadge?.ditolakBaru} variant="danger" title="Permintaan ditolak (baru)" />
            </Link>
            <Link href="/permintaan/tugas" className={linkClass("/permintaan/tugas")} onClick={handleNav}>
              <i className="fa-solid fa-truck" />
              <span>Monitoring Petugas</span>
            </Link>

            <div className="sidebar-group-label">RIWAYAT & LAPORAN</div>
            <Link href="/log-stok" className={linkClass("/log-stok")} onClick={handleNav}>
              <i className="fa-solid fa-clock-rotate-left" />
              <span>Log Stok</span>
            </Link>
            <Link href="/laporan" className={linkClass("/laporan")} onClick={handleNav}>
              <i className="fa-solid fa-chart-line" />
              <span>Cetak Laporan</span>
            </Link>

            <div className="sidebar-group-label">ADMINISTRASI</div>
            <Link href="/users" className={linkClass("/users")} onClick={handleNav}>
              <i className="fa-solid fa-users-gear" />
              <span>Manajemen User</span>
            </Link>
          </>
        )}

        {/* ========== STAFF: menu sesuai kebutuhan ========== */}
        {role === "STAFF" && (
          <>
            <div className="sidebar-group-label">UTAMA</div>
            <Link href="/dashboard" className={linkClass("/dashboard")} onClick={handleNav}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">OPERASIONAL</div>
            <Link href="/barang" className={linkClass("/barang")} onClick={handleNav}>
              <i className="fa-solid fa-box" />
              <span>Minta Barang</span>
            </Link>
            <Link href="/permintaan" className={linkClass("/permintaan")} onClick={handleNav}>
              <i className="fa-solid fa-clock-rotate-left" />
              <span>Riwayat Permintaan Barang</span>
            </Link>

          </>
        )}

        {/* ========== PETUGAS: menu sesuai kebutuhan ========== */}
        {role === "PETUGAS" && (
          <>
            <div className="sidebar-group-label">UTAMA</div>
            <Link href="/dashboard" className={linkClass("/dashboard")} onClick={handleNav}>
              <i className="fa-solid fa-house" />
              <span>Dashboard</span>
            </Link>

            <div className="sidebar-group-label">OPERASIONAL</div>
            <Link href="/barang" className={linkClass("/barang")} onClick={handleNav}>
              <i className="fa-solid fa-box" />
              <span>Minta Barang</span>
            </Link>
            <Link href="/permintaan/tugas" className={linkClass("/permintaan/tugas")} onClick={handleNav}>
              <i className="fa-solid fa-truck" />
              <span>Daftar Tugas</span>
              <Badge count={tugasBadge?.tugasBaru} title="Tugas baru" />
            </Link>
            <Link href="/permintaan/riwayat" className={linkClass("/permintaan/riwayat")} onClick={handleNav}>
              <i className="fa-solid fa-clock-rotate-left" />
              <span>Riwayat Tugas</span>
            </Link>

          </>
        )}

        {Boolean(role) && (
          <>
            <div className="sidebar-spacer" />
            <div className="sidebar-divider" />
            <button type="button" className="sidebar-link" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket" />
              <span>Log Out</span>
            </button>
          </>
        )}
      </nav>
    </aside>
  );
}
