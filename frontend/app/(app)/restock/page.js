"use client";

/**
 * Restock (Stok Masuk) — Admin: form input + riwayat restock.
 * POST /api/restock, GET /api/restock, GET /api/barang (untuk dropdown).
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export default function RestockPage() {
  const [user, setUser] = useState(null);
  const [barang, setBarang] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ barangId: "", jumlah: "", sumber: "", tanggal: "" });

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const fetchBarang = async () => {
    try {
      const res = await fetch(apiUrl("/api/barang"), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setBarang(data.data?.barang || []);
    } catch (_) {}
  };

  const fetchRestock = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/restock"), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setList(data.data?.list || []);
      else setError(data.message || "Gagal memuat riwayat");
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchBarang();
    fetchRestock();
  }, [user?.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.barangId?.trim() || !form.jumlah || Number(form.jumlah) <= 0) {
      setError("Pilih barang dan isi jumlah (positif).");
      return;
    }
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/restock"), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          barangId: form.barangId.trim(),
          jumlah: Number(form.jumlah),
          sumber: form.sumber?.trim() || null,
          tanggal: form.tanggal || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ barangId: "", jumlah: "", sumber: "", tanggal: "" });
        fetchRestock();
      } else {
        setError(data.message || "Gagal mencatat restock");
      }
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Restock</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="app-content">
      <h1>Restock (Stok Masuk)</h1>
      <p className="app-muted" style={{ marginBottom: "1.5rem" }}>
        Catat penambahan stok: pilih barang, jumlah, sumber (opsional), dan tanggal.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: "400px", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label>
          Barang <span style={{ color: "var(--danger)" }}>*</span>
          <select
            value={form.barangId}
            onChange={(e) => setForm((f) => ({ ...f, barangId: e.target.value }))}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          >
            <option value="">— Pilih barang —</option>
            {barang.map((b) => (
              <option key={b.id} value={b.id}>{b.nama} ({b.satuan})</option>
            ))}
          </select>
        </label>
        <label>
          Jumlah <span style={{ color: "var(--danger)" }}>*</span>
          <input
            type="number"
            min="1"
            value={form.jumlah}
            onChange={(e) => setForm((f) => ({ ...f, jumlah: e.target.value }))}
            placeholder="Contoh: 10"
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>
        <label>
          Sumber (opsional)
          <input
            type="text"
            value={form.sumber}
            onChange={(e) => setForm((f) => ({ ...f, sumber: e.target.value }))}
            placeholder="Contoh: Pembelian, Donasi"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>
        <label>
          Tanggal
          <input
            type="date"
            value={form.tanggal || today}
            onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </label>
        {error && <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitLoading}>
          {submitLoading ? "Menyimpan..." : "Simpan Restock"}
        </button>
      </form>

      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Riwayat Restock</h2>
      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Barang</th>
                <th>Jumlah</th>
                <th>Sumber</th>
                <th>Oleh</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={5} className="app-muted">Belum ada data restock.</td></tr>
              ) : (
                list.map((r) => (
                  <tr key={r.id}>
                    <td>{r.tanggal ? new Date(r.tanggal).toLocaleDateString("id-ID") : "-"}</td>
                    <td>{r.barang?.nama ?? "-"} ({r.barang?.satuan ?? "-"})</td>
                    <td>{r.jumlah}</td>
                    <td>{r.sumber ?? "-"}</td>
                    <td>{r.admin?.nama ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
