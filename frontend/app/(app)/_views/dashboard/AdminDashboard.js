"use client";

/**
 * Dashboard Admin — ringkasan: pending, on delivery, stok menipis, antrian, tugas aktif.
 * Data dari GET /api/admin/dashboard (hanya ADMIN).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export default function AdminDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboard() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl("/api/admin/dashboard"), {
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) setData(json.data);
        else setError(json.message || "Gagal memuat dashboard");
      } catch (err) {
        if (!cancelled) setError("Koneksi gagal. Pastikan backend jalan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (user?.role === "ADMIN") fetchDashboard();
    return () => { cancelled = true; };
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

  const statCards = [
    {
      key: "waiting",
      label: "Menunggu Diambil",
      value: totalPending,
      bg: "#fff7ed",
      border: "#fdba74",
      color: "#f59e0b",
      icon: "fa-solid fa-clock",
      link: "/permintaan",
      linkLabel: "Lihat daftar",
    },
    {
      key: "delivery",
      label: "Sedang Diantar",
      value: totalOnDelivery,
      bg: "#eff6ff",
      border: "#93c5fd",
      color: "#3b82f6",
      icon: "fa-solid fa-truck",
    },
    {
      key: "lowstock",
      label: "Stok Menipis",
      value: stokMenipis.length,
      bg: "#f5f3ff",
      border: "#c4b5fd",
      color: "#8b5cf6",
      icon: "fa-solid fa-boxes-stacked",
      link: "/barang",
      linkLabel: "Kelola barang",
    },
    {
      key: "delivered",
      label: "Selesai",
      value: totalDelivered,
      bg: "#ecfdf5",
      border: "#86efac",
      color: "#22c55e",
      icon: "fa-solid fa-circle-check",
    },
  ];

  return (
    <main className="app-content">
      <h1>Dashboard Admin</h1>
      {user && (
        <p className="app-muted" style={{ marginBottom: "1.5rem" }}>
          Halo, <strong>{user.nama}</strong>. Ringkasan operasional gudang hari ini.
        </p>
      )}

      {/* Kartu ringkasan */}
      <div className="stats-grid" style={{ marginBottom: "1.35rem" }}>
        {statCards.map((card) => (
          <div
            key={card.key}
            className="stats-card"
            style={{
              "--accent": card.color,
              "--accent-soft": card.bg,
            }}
          >
            <div className="stats-card-head">
              <span className="stats-icon">
                <i className={card.icon} />
              </span>
              <div className="stats-value">{card.value}</div>
            </div>
            <div className="stats-label">{card.label}</div>
            {card.link && (
              <Link
                href={card.link}
                className="stats-link"
              >
                {card.linkLabel} →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Stok menipis (list singkat) */}
      {stokMenipis.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Barang stok di bawah minimum</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
            {stokMenipis.slice(0, 5).map((b) => (
              <li key={b.id} style={{ padding: "0.55rem 0.75rem", borderBottom: "1px solid var(--border)" }}>
                {b.nama} — stok: <strong>{b.stok}</strong> {b.satuan} (min: {b.stokMinimum})
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>
      {/* Antrian siap diambil petugas */}
        <section>
          <div className="page-head" style={{ marginBottom: "0.45rem" }}>
            <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Antrian menunggu diambil petugas</h2>
            <Link href="/permintaan" className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}>
              Buka Permintaan
            </Link>
          </div>
          {antrianPending.length === 0 ? (
            <p className="app-muted">Tidak ada.</p>
          ) : (
            <div className="table-wrap">
              <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
                <thead>
                  <tr><th>Peminta</th><th>Barang</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {antrianPending.map((p) => (
                    <tr key={p.id}>
                      <td>{p.peminta?.nama ?? "-"}</td>
                      <td>{p.items?.map((i) => i.barang?.nama).filter(Boolean).join(", ") || "-"}</td>
                      <td><Link href="/permintaan">Lihat</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tugas pengantaran aktif */}
        <section>
          <div className="page-head" style={{ marginBottom: "0.45rem" }}>
            <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Tugas pengantaran aktif</h2>
            <Link href="/permintaan/tugas" className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}>
              Lihat Tugas
            </Link>
          </div>
          {tugasAktif.length === 0 ? (
            <p className="app-muted">Tidak ada.</p>
          ) : (
            <div className="table-wrap">
              <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
                <thead>
                  <tr><th>Peminta</th><th>Petugas</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {tugasAktif.map((t) => (
                    <tr key={t.id}>
                      <td>{t.permintaan?.peminta?.nama ?? "-"}</td>
                      <td>{t.petugas?.nama ?? "Belum diambil"}</td>
                      <td>{t.statusTugas === "ON_DELIVERY" ? "Dalam perjalanan" : "Menunggu diambil"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
