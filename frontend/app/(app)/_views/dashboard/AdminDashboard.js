"use client";

/**
 * Dashboard Admin — ringkasan: pending, on delivery, stok menipis, antrian, tugas aktif.
 * Data dari GET /api/admin/dashboard (hanya ADMIN).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { UserCell } from "@/components/ui";

/** Format tanggal Indonesia panjang: "Kamis, 16 April 2026" */
function formatTanggalID(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

/** Ambil inisial 2 huruf dari nama. Dipakai di avatar hero. */
function getInitials(nama) {
  if (!nama) return "AD";
  const parts = String(nama).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Mapping status tugas → pill variant + label ramah.
 *
 * Catatan: handle dua "pasang" legacy/modern:
 *   - ON_DELIVERY  ↔ DALAM_PROSES  → sama-sama "Dalam perjalanan"
 *   - DELIVERED    ↔ SELESAI       → sama-sama "Selesai"
 */
function mapStatusTugas(status) {
  switch (status) {
    case "ON_DELIVERY":
    case "DALAM_PROSES":
      return { label: "Dalam perjalanan", variant: "info" };
    case "MENUNGGU_ASSIGN":
      return { label: "Menunggu diambil", variant: "warning" };
    case "DELIVERED":
    case "SELESAI":
      return { label: "Selesai", variant: "success" };
    case "DITOLAK":
      return { label: "Ditolak", variant: "danger" };
    default:
      return { label: status || "—", variant: "muted" };
  }
}

/** Komponen kecil: pill status */
function Pill({ variant = "muted", children }) {
  return <span className={`pill pill-${variant}`}>{children}</span>;
}

/** Komponen kecil: empty state dengan ikon */
function EmptyState({ icon = "fa-solid fa-inbox", title, sub }) {
  return (
    <div className="empty-state">
      <i className={icon} />
      <div className="empty-state-title">{title}</div>
      {sub && <p className="empty-state-sub">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function fetchDashboard({ silent = false } = {}) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/admin/dashboard"), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || "Gagal memuat dashboard");
    } catch (err) {
      setError("Koneksi gagal. Pastikan backend jalan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (user?.role === "ADMIN") fetchDashboard();
  }, [user?.role]);

  if (loading && !data) {
    return (
      <main className="app-content">
        <h1>Dashboard Admin</h1>
        <p className="app-muted">Memuat data...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="app-content">
        <h1>Dashboard Admin</h1>
        <p style={{ color: "var(--danger)" }}>{error}</p>
      </main>
    );
  }

  const totalPending = data?.totalPending ?? 0;
  const totalOnDelivery = data?.totalOnDelivery ?? 0;
  const stokMenipis = data?.stokMenipis ?? [];
  const antrianPending = data?.antrianPending ?? [];
  const tugasAktif = data?.tugasAktif ?? [];
  const totalDelivered = data?.totalDelivered ?? 0;

  /**
   * Daftar stat card. Semua kartu punya link (klikable).
   * Properti `emptyText` dipakai saat value = 0 biar tidak terasa "error".
   */
  const statCards = [
    {
      key: "waiting",
      label: "Menunggu Diambil",
      value: totalPending,
      bg: "#fff7ed",
      color: "#f59e0b",
      icon: "fa-solid fa-clock",
      link: "/permintaan",
      emptyText: "Antrian kosong",
    },
    {
      key: "delivery",
      label: "Sedang Diantar",
      value: totalOnDelivery,
      bg: "#eff6ff",
      color: "#3b82f6",
      icon: "fa-solid fa-truck",
      link: "/permintaan/tugas",
      emptyText: "Belum ada tugas aktif",
    },
    {
      key: "lowstock",
      label: "Stok Menipis",
      value: stokMenipis.length,
      bg: "#f5f3ff",
      color: "#8b5cf6",
      icon: "fa-solid fa-boxes-stacked",
      link: "/barang",
      emptyText: "Stok aman semua",
    },
    {
      key: "delivered",
      label: "Selesai",
      value: totalDelivered,
      bg: "#ecfdf5",
      color: "#22c55e",
      icon: "fa-solid fa-circle-check",
      link: "/permintaan",
      emptyText: "Belum ada yang selesai",
    },
  ];

  return (
    <main className="app-content">
      {/* Hero / greeting card — pola dashboard-hero konsisten dgn Staff & Petugas */}
      <div className="dashboard-hero">
        <span className="dashboard-hero-avatar" aria-hidden="true">
          {getInitials(user?.nama)}
        </span>
        <div className="dashboard-hero-body">
          <p className="dashboard-hero-greet">
            Halo,{" "}
            <span style={{ color: "var(--primary)" }}>
              {user?.nama || "Admin"}
            </span>
          </p>
          <p className="dashboard-hero-sub">
            <i
              className="fa-regular fa-calendar"
              style={{ marginRight: "0.35rem" }}
              aria-hidden="true"
            />
            {formatTanggalID()} · Ringkasan operasional gudang hari ini.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fetchDashboard({ silent: true })}
            disabled={refreshing}
            title="Muat ulang data"
          >
            <i className={`fa-solid fa-rotate ${refreshing ? "fa-spin" : ""}`} />
            {refreshing ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Kartu ringkasan — semua klikable, pola stats-card-link (hover animation) */}
      <div className="stats-grid" style={{ marginBottom: "1.35rem" }}>
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.link}
            className="stats-card-link"
            title={`Lihat ${card.label.toLowerCase()}`}
          >
            <div
              className="stats-card"
              style={{ "--accent": card.color, "--accent-soft": card.bg }}
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

      {/* Stok menipis (list singkat) */}
      {stokMenipis.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <div className="section-title">
            <h2>Stok di bawah minimum</h2>
            <Link href="/barang" className="btn-icon">
              <i className="fa-solid fa-gear" />
              <span>Kelola</span>
            </Link>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
            {stokMenipis.slice(0, 5).map((b) => (
              <li key={b.id} style={{ padding: "0.6rem 0.85rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
                <span>{b.nama}</span>
                <span className="app-muted" style={{ fontSize: "0.85rem" }}>
                  stok <strong style={{ color: "#b45309" }}>{b.stok}</strong> {b.satuan} <span style={{ opacity: 0.7 }}>(min {b.stokMinimum})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="dash-two-col">
        {/* Antrian siap diambil petugas */}
        <section>
          <div className="section-title">
            <h2>Antrian menunggu diambil</h2>
            <Link href="/permintaan" className="btn-icon">
              <i className="fa-solid fa-arrow-up-right-from-square" />
              <span>Buka Permintaan</span>
            </Link>
          </div>
          {antrianPending.length === 0 ? (
            <EmptyState
              icon="fa-solid fa-inbox"
              title="Belum ada antrian"
              sub="Semua permintaan sudah diproses."
            />
          ) : (
            <div className="table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Peminta</th>
                    <th>Barang</th>
                    <th style={{ width: 70, textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {antrianPending.map((p) => {
                    const items = p.items || [];
                    const totalQty = items.reduce(
                      (s, i) => s + (i.jumlah || 0),
                      0
                    );
                    const itemTooltip = items
                      .map(
                        (i) =>
                          `${i.barang?.nama ?? "-"} × ${i.jumlah || 1}${
                            i.barang?.satuan ? ` ${i.barang.satuan}` : ""
                          }`
                      )
                      .join("\n");
                    return (
                      <tr key={p.id}>
                        <td>
                          <UserCell name={p.peminta?.nama} />
                        </td>
                        <td>
                          {items.length === 0 ? (
                            <span className="app-muted">—</span>
                          ) : items.length === 1 ? (
                            <span title={itemTooltip}>
                              {items[0].barang?.nama || "—"}
                            </span>
                          ) : (
                            <span
                              className="pill pill-muted"
                              title={itemTooltip}
                              style={{ cursor: "help" }}
                            >
                              {items.length} item · {totalQty} pcs
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            href="/permintaan"
                            className="icon-btn"
                            title="Buka di Permintaan Masuk"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tugas pengantaran aktif */}
        <section>
          <div className="section-title">
            <h2>Tugas pengantaran aktif</h2>
            <Link href="/permintaan/tugas" className="btn-icon">
              <i className="fa-solid fa-truck" />
              <span>Lihat Tugas</span>
            </Link>
          </div>
          {tugasAktif.length === 0 ? (
            <EmptyState
              icon="fa-solid fa-truck-fast"
              title="Belum ada tugas aktif"
              sub="Tugas akan muncul setelah admin approve permintaan."
            />
          ) : (
            <div className="table-wrap">
              <table className="app-table">
                <thead>
                  <tr><th>Peminta</th><th>Petugas</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {tugasAktif.map((t) => {
                    const s = mapStatusTugas(t.statusTugas);
                    const petugasName = t.petugas?.nama;
                    return (
                      <tr key={t.id}>
                        <td><UserCell name={t.permintaan?.peminta?.nama} /></td>
                        <td>
                          {petugasName
                            ? <UserCell name={petugasName} />
                            : <Pill variant="muted">Belum diambil</Pill>}
                        </td>
                        <td><Pill variant={s.variant}>{s.label}</Pill></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
