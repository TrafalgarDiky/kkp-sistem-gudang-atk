"use client";

/**
 * Dashboard Petugas (Opsi A — Ringkas, non-duplikat).
 *
 * Desain:
 *   - Fokus ke RINGKASAN + SHORTCUT, bukan daftar tugas.
 *   - Daftar tugas lengkap ada di menu "Daftar Tugas" (sidebar).
 *
 * Bagian halaman:
 *   1. Hero greeting (nama + waktu + 1 CTA Buka Daftar Tugas).
 *   2. Cart alert (muncul kalau petugas punya isi di keranjang).
 *   3. 3 Stat cards clickable — drill-down ke halaman yang tepat:
 *      - Tersedia         → /permintaan/tugas?kepemilikan=TERSEDIA
 *      - Tugas Saya Aktif → /permintaan/tugas?kepemilikan=SAYA
 *      - Selesai Hari Ini → /permintaan/riwayat
 *   4. Empty state kalau belum ada tugas sama sekali.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { useCart } from "@/lib/useCart";

/* ========================= Helpers ========================= */

/**
 * Greeting sesuai jam lokal:
 *  5–10  : pagi
 *  11–14 : siang
 *  15–17 : sore
 *  18–4  : malam
 */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h <= 10) return "Selamat pagi";
  if (h >= 11 && h <= 14) return "Selamat siang";
  if (h >= 15 && h <= 17) return "Selamat sore";
  return "Selamat malam";
}

function getInitials(nama) {
  if (!nama) return "?";
  const parts = String(nama).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Cek apakah tanggal `dt` adalah hari ini (berdasarkan timezone lokal). */
function isToday(dt) {
  if (!dt) return false;
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/* ========================= Component ========================= */

export default function PetugasDashboard({ user }) {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { count: cartCount, totalQty: cartTotalQty } = useCart();

  useEffect(() => {
    let cancelled = false;
    async function fetchTugas() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl("/api/permintaan/tugas"), {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success) setTugas(data.data?.tugas || []);
        else setError(data.message || "Gagal memuat tugas petugas");
      } catch {
        if (!cancelled) setError("Koneksi gagal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTugas();
    return () => {
      cancelled = true;
    };
  }, []);

  const meId = user?.id;

  /**
   * 3 kategori stat (non-overlap):
   *   tersedia   = MENUNGGU_ASSIGN + belum diambil siapa pun + bukan ditolak
   *   sayaAktif  = petugasId = saya + status aktif + bukan ditolak
   *   selesaiHariIni = petugasId = saya + status selesai + updatedAt = hari ini
   */
  const stats = useMemo(() => {
    let tersedia = 0;
    let sayaAktif = 0;
    let selesaiHariIni = 0;

    for (const t of tugas) {
      const ditolak = t.permintaan?.statusAdmin === "DITOLAK_ADMIN";
      if (ditolak) continue;

      if (t.statusTugas === "MENUNGGU_ASSIGN" && !t.petugasId) {
        tersedia += 1;
        continue;
      }
      if (t.petugasId === meId) {
        if (
          ["MENUNGGU_ASSIGN", "DALAM_PROSES", "ON_DELIVERY"].includes(
            t.statusTugas
          )
        ) {
          sayaAktif += 1;
        } else if (
          ["SELESAI", "DELIVERED"].includes(t.statusTugas) &&
          isToday(t.updatedAt || t.createdAt)
        ) {
          selesaiHariIni += 1;
        }
      }
    }
    return { tersedia, sayaAktif, selesaiHariIni };
  }, [tugas, meId]);

  /**
   * Konfigurasi 3 stat card.
   * `href` dipakai untuk drill-down dari kartu ke halaman yang sesuai.
   */
  const statCards = [
    {
      key: "tersedia",
      href: "/permintaan/tugas?kepemilikan=TERSEDIA",
      label: "Tersedia",
      value: stats.tersedia,
      color: "#f59e0b",
      soft: "#fff7ed",
      icon: "fa-solid fa-hourglass-half",
    },
    {
      key: "saya-aktif",
      href: "/permintaan/tugas?kepemilikan=SAYA",
      label: "Tugas Saya Aktif",
      value: stats.sayaAktif,
      color: "#3b82f6",
      soft: "#eff6ff",
      icon: "fa-solid fa-truck-fast",
    },
    {
      key: "selesai-hari-ini",
      href: "/permintaan/riwayat",
      label: "Selesai Hari Ini",
      value: stats.selesaiHariIni,
      color: "#22c55e",
      soft: "#ecfdf5",
      icon: "fa-solid fa-circle-check",
    },
  ];

  const isEmpty = !loading && tugas.length === 0;

  /* ========================= Render ========================= */
  return (
    <main className="app-content">
      {/* ---------- Hero greeting ---------- */}
      <div className="dashboard-hero">
        <span className="dashboard-hero-avatar" aria-hidden="true">
          {getInitials(user?.nama)}
        </span>
        <div className="dashboard-hero-body">
          <p className="dashboard-hero-greet">
            {getGreeting()},{" "}
            <span style={{ color: "var(--primary)" }}>
              {user?.nama || "Petugas"}
            </span>
          </p>
          <p className="dashboard-hero-sub">
            Ringkasan tugas pengantaran kamu. Klik kartu di bawah untuk lihat
            detail sesuai statusnya.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/permintaan/tugas" className="btn-primary">
            <i className="fa-solid fa-truck-fast" /> Buka Daftar Tugas
          </Link>
        </div>
      </div>

      {/* ---------- Cart alert (kondisional) ---------- */}
      {cartCount > 0 && (
        <Link href="/barang" className="dashboard-alert is-info">
          <span className="dashboard-alert-icon">
            <i className="fa-solid fa-cart-shopping" />
          </span>
          <div className="dashboard-alert-body">
            <strong>
              Kamu punya {cartCount} jenis barang ({cartTotalQty} pcs) di
              keranjang
            </strong>
            <p>Lanjutkan ke katalog untuk review dan ajukan permintaan.</p>
          </div>
          <i className="fa-solid fa-arrow-right dashboard-alert-arrow" />
        </Link>
      )}

      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : isEmpty ? (
        /* ---------- Empty state (belum ada tugas sama sekali) ---------- */
        <div className="empty-state" style={{ marginTop: "1rem" }}>
          <i className="fa-solid fa-truck" />
          <div className="empty-state-title">Belum ada tugas</div>
          <p className="empty-state-sub">
            Saat ada permintaan disetujui admin, tugas baru akan muncul di{" "}
            <Link href="/permintaan/tugas" style={{ color: "var(--primary)" }}>
              Daftar Tugas
            </Link>
            .
          </p>
        </div>
      ) : (
        /* ---------- 3 Stat Cards (clickable, drill-down) ---------- */
        <section>
          <div className="stats-grid">
            {statCards.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="stats-card-link"
                title={`Lihat ${card.label.toLowerCase()}`}
              >
                <div
                  className="stats-card"
                  style={{
                    "--accent": card.color,
                    "--accent-soft": card.soft,
                  }}
                >
                  <div className="stats-card-head">
                    <span className="stats-icon">
                      <i className={card.icon} />
                    </span>
                    <div className="stats-value">{card.value}</div>
                  </div>
                  <div className="stats-label">{card.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
