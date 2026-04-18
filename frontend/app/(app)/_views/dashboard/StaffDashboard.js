"use client";

/**
 * Dashboard Staff (Option A — Ringkas, non-duplikat).
 *
 * Desain:
 *   - Dashboard fokus ke RINGKASAN + SHORTCUT, bukan daftar riwayat.
 *   - Daftar riwayat lengkap tersedia di menu "Riwayat Permintaan Barang"
 *     (sidebar), jadi tidak kita duplikat di sini.
 *
 * Bagian halaman:
 *   1. Hero greeting (nama + waktu + 1 CTA Minta Barang).
 *   2. Cart alert banner (muncul kalau ada isi di keranjang).
 *   3. 4 Stat cards clickable — tiap card drill-down ke /permintaan?status=...
 *   4. Empty state kalau user belum pernah buat permintaan.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { useCart } from "@/lib/useCart";

/* ========================= Helpers ========================= */

/**
 * Greeting sesuai jam lokal:
 * - 5–10  : pagi
 * - 11–14 : siang
 * - 15–17 : sore
 * - 18–4  : malam
 */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h <= 10) return "Selamat pagi";
  if (h >= 11 && h <= 14) return "Selamat siang";
  if (h >= 15 && h <= 17) return "Selamat sore";
  return "Selamat malam";
}

/** Ambil inisial 2 huruf dari nama user. */
function getInitials(nama) {
  if (!nama) return "?";
  const parts = String(nama).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ========================= Component ========================= */

export default function StaffDashboard({ user }) {
  const [permintaan, setPermintaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { count: cartCount, totalQty: cartTotalQty } = useCart();

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(apiUrl("/api/permintaan"), { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPermintaan(data.data?.permintaan || []);
        else setError(data.message || "Gagal memuat");
      })
      .catch(() => setError("Koneksi gagal."))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Hitung 4 kategori status yang NON-OVERLAP.
   * Tiap permintaan hanya masuk 1 kategori.
   */
  const stats = useMemo(() => {
    let menungguAdmin = 0;
    let menungguDiambil = 0;
    let diantar = 0;
    let sudahSampai = 0;

    for (const p of permintaan) {
      if (p.statusAdmin === "MENUNGGU_ADMIN") {
        menungguAdmin += 1;
      } else if (p.statusAdmin === "DISETUJUI_ADMIN") {
        if (p.tugasPetugas?.[0]?.petugas) diantar += 1;
        else menungguDiambil += 1;
      } else if (p.statusAdmin === "SELESAI") {
        sudahSampai += 1;
      }
    }
    return { menungguAdmin, menungguDiambil, diantar, sudahSampai };
  }, [permintaan]);

  /**
   * Konfigurasi 4 stat card.
   * Nilai `statusKey` dikirim ke /permintaan?status=... supaya halaman
   * riwayat otomatis ter-filter sesuai kartu yang diklik.
   */
  const statCards = [
    {
      key: "menunggu-admin",
      statusKey: "MENUNGGU",
      label: "Menunggu Admin",
      value: stats.menungguAdmin,
      color: "#f59e0b",
      soft: "#fff7ed",
      icon: "fa-solid fa-hourglass-half",
    },
    {
      key: "menunggu-diambil",
      statusKey: "DISETUJUI",
      label: "Menunggu Diambil",
      value: stats.menungguDiambil,
      color: "#3b82f6",
      soft: "#eff6ff",
      icon: "fa-solid fa-box-open",
    },
    {
      key: "diantar",
      statusKey: "DIANTAR",
      label: "Diantar",
      value: stats.diantar,
      color: "#8b5cf6",
      soft: "#f5f3ff",
      icon: "fa-solid fa-truck-fast",
    },
    {
      key: "sudah-sampai",
      statusKey: "SELESAI",
      label: "Sudah Sampai",
      value: stats.sudahSampai,
      color: "#22c55e",
      soft: "#ecfdf5",
      icon: "fa-solid fa-circle-check",
    },
  ];

  const isEmpty = !loading && permintaan.length === 0;

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
              {user?.nama || "Staff"}
            </span>
          </p>
          <p className="dashboard-hero-sub">
            Ini ringkasan permintaan ATK kamu. Klik kartu di bawah untuk
            melihat detail sesuai statusnya.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/barang" className="btn-primary">
            <i className="fa-solid fa-cart-plus" /> Minta Barang
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
        /* ---------- Empty state (belum pernah buat permintaan) ---------- */
        <div
          className="empty-state"
          style={{ marginTop: "1rem" }}
        >
          <i className="fa-solid fa-clipboard-list" />
          <div className="empty-state-title">Belum ada permintaan</div>
          <p className="empty-state-sub">
            Mulai dengan membuka{" "}
            <Link href="/barang" style={{ color: "var(--primary)" }}>
              Katalog ATK
            </Link>{" "}
            dan tambahkan barang ke keranjang.
          </p>
        </div>
      ) : (
        /* ---------- 4 Stat Cards (clickable, drill-down) ---------- */
        <section>
          <div className="stats-grid">
            {statCards.map((card) => (
              <Link
                key={card.key}
                href={`/permintaan?status=${card.statusKey}`}
                className="stats-card-link"
                title={`Lihat permintaan berstatus "${card.label}"`}
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
