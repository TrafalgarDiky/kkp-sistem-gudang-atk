"use client";

/**
 * Laporan — Admin: rekap permintaan selesai & pemakaian per barang per periode.
 * GET /api/laporan?dari=&sampai=
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export default function LaporanPage() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ dari: "", sampai: "" });

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filter.dari) params.set("dari", filter.dari);
      if (filter.sampai) params.set("sampai", filter.sampai);
      const q = params.toString();
      const res = await fetch(apiUrl("/api/laporan" + (q ? "?" + q : "")), { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || "Gagal memuat laporan");
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleCari = (e) => {
    e?.preventDefault();
    fetchLaporan();
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    // Load once with empty filter (all time)
    fetchLaporan();
  }, [user?.role]);

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Laporan</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  const permintaan = data?.permintaan ?? [];
  const pemakaian = data?.pemakaian ?? [];
  const totalPermintaan = data?.totalPermintaan ?? 0;

  return (
    <main className="app-content">
      <h1>Laporan</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Rekap permintaan selesai dan pemakaian per barang. Filter periode (opsional).
      </p>

      <form onSubmit={handleCari} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem", alignItems: "flex-end" }}>
        <label>
          Dari
          <input
            type="date"
            value={filter.dari}
            onChange={(e) => setFilter((f) => ({ ...f, dari: e.target.value }))}
            style={{ marginLeft: "0.5rem", padding: "0.35rem" }}
          />
        </label>
        <label>
          Sampai
          <input
            type="date"
            value={filter.sampai}
            onChange={(e) => setFilter((f) => ({ ...f, sampai: e.target.value }))}
            style={{ marginLeft: "0.5rem", padding: "0.35rem" }}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Memuat..." : "Tampilkan"}</button>
      </form>

      {error && <p style={{ color: "var(--danger)", marginBottom: "0.5rem" }}>{error}</p>}

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Rekap pemakaian per barang</h2>
        <p className="app-muted" style={{ marginBottom: "0.5rem" }}>Total permintaan selesai: {totalPermintaan}</p>
        <div style={{ overflowX: "auto" }}>
          <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th>Barang</th>
                <th>Satuan</th>
                <th>Total keluar</th>
              </tr>
            </thead>
            <tbody>
              {pemakaian.length === 0 ? (
                <tr><td colSpan={3} className="app-muted">Tidak ada data pemakaian.</td></tr>
              ) : (
                pemakaian.map((p) => (
                  <tr key={p.barangId}>
                    <td>{p.namaBarang}</td>
                    <td>{p.satuan}</td>
                    <td>{p.totalQty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Daftar permintaan selesai</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th>Peminta</th>
                <th>Barang (item)</th>
                <th>Update terakhir</th>
              </tr>
            </thead>
            <tbody>
              {permintaan.length === 0 ? (
                <tr><td colSpan={3} className="app-muted">Tidak ada permintaan selesai.</td></tr>
              ) : (
                permintaan.map((p) => (
                  <tr key={p.id}>
                    <td>{p.peminta?.nama ?? "-"}</td>
                    <td>{p.items?.map((i) => `${i.barang?.nama ?? "-"} (${i.jumlah})`).join(", ") || "-"}</td>
                    <td>{p.updatedAt ? new Date(p.updatedAt).toLocaleString("id-ID") : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
