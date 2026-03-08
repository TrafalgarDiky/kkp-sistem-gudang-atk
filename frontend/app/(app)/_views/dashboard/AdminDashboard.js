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

  return (
    <main className="app-content">
      <h1>Dashboard Admin</h1>
      {user && (
        <p className="app-muted" style={{ marginBottom: "1.5rem" }}>
          Halo, <strong>{user.nama}</strong>. Ringkasan gudang dan antrian.
        </p>
      )}

      {/* Kartu ringkasan */}
      <div className="dashboard-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "1rem", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Permintaan Pending</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{totalPending}</div>
          <Link href="/permintaan" style={{ fontSize: "0.85rem", marginTop: "0.5rem", display: "inline-block" }}>Lihat →</Link>
        </div>
        <div className="card" style={{ padding: "1rem", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Sedang Dikirim</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700" }}>{totalOnDelivery}</div>
        </div>
        <div className="card" style={{ padding: "1rem", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Stok Menipis</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "700", color: stokMenipis.length > 0 ? "var(--warning)" : "inherit" }}>{stokMenipis.length}</div>
          {stokMenipis.length > 0 && (
            <Link href="/barang" style={{ fontSize: "0.85rem", marginTop: "0.5rem", display: "inline-block" }}>Kelola →</Link>
          )}
        </div>
      </div>

      {/* Stok menipis (list singkat) */}
      {stokMenipis.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Barang stok di bawah minimum</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {stokMenipis.slice(0, 5).map((b) => (
              <li key={b.id} style={{ padding: "0.35rem 0", borderBottom: "1px solid var(--border)" }}>
                {b.nama} — stok: <strong>{b.stok}</strong> {b.satuan} (min: {b.stokMinimum})
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Antrian pending */}
        <section>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Antrian menunggu persetujuan</h2>
          {antrianPending.length === 0 ? (
            <p className="app-muted">Tidak ada.</p>
          ) : (
            <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
              <thead>
                <tr><th>Peminta</th><th>Barang</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {antrianPending.map((p) => (
                  <tr key={p.id}>
                    <td>{p.peminta?.nama ?? "-"}</td>
                    <td>{p.items?.map((i) => i.barang?.nama).filter(Boolean).join(", ") || "-"}</td>
                    <td><Link href="/permintaan">Proses</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Tugas pengantaran aktif */}
        <section>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Tugas pengantaran aktif</h2>
          {tugasAktif.length === 0 ? (
            <p className="app-muted">Tidak ada.</p>
          ) : (
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
          )}
        </section>
      </div>
    </main>
  );
}
