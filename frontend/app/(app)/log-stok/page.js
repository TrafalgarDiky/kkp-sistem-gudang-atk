"use client";

/**
 * Log Stok — Admin: daftar audit perubahan stok dengan filter (barang, periode, jenis).
 * GET /api/log-stok?barangId=&dari=&sampai=&jenis=
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export default function LogStokPage() {
  const [user, setUser] = useState(null);
  const [barang, setBarang] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ barangId: "", dari: "", sampai: "", jenis: "" });

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

  const fetchLog = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filter.barangId) params.set("barangId", filter.barangId);
      if (filter.dari) params.set("dari", filter.dari);
      if (filter.sampai) params.set("sampai", filter.sampai);
      if (filter.jenis) params.set("jenis", filter.jenis);
      const q = params.toString();
      const res = await fetch(apiUrl("/api/log-stok" + (q ? "?" + q : "")), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setList(data.data?.list || []);
      else setError(data.message || "Gagal memuat log");
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchBarang();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchLog();
  }, [user?.role, filter.barangId, filter.dari, filter.sampai, filter.jenis]);

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Log Stok</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  const labelJenis = (j) => ({ APPROVE: "Permintaan disetujui", RESTOCK: "Restock", PENYESUAIAN: "Penyesuaian" }[j] || j);

  return (
    <main className="app-content">
      <h1>Log Stok (Audit)</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Jejak perubahan stok: bertambah/berkurang, jenis, waktu, dan admin.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem", alignItems: "flex-end" }}>
        <label>
          Barang
          <select
            value={filter.barangId}
            onChange={(e) => setFilter((f) => ({ ...f, barangId: e.target.value }))}
            style={{ marginLeft: "0.5rem", padding: "0.35rem" }}
          >
            <option value="">Semua</option>
            {barang.map((b) => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
        </label>
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
        <label>
          Jenis
          <select
            value={filter.jenis}
            onChange={(e) => setFilter((f) => ({ ...f, jenis: e.target.value }))}
            style={{ marginLeft: "0.5rem", padding: "0.35rem" }}
          >
            <option value="">Semua</option>
            <option value="APPROVE">Permintaan disetujui</option>
            <option value="RESTOCK">Restock</option>
            <option value="PENYESUAIAN">Penyesuaian</option>
          </select>
        </label>
      </div>

      {error && <p style={{ color: "var(--danger)", marginBottom: "0.5rem" }}>{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Barang</th>
                <th>Perubahan</th>
                <th>Jenis</th>
                <th>Oleh</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={5} className="app-muted">Tidak ada log.</td></tr>
              ) : (
                list.map((log) => (
                  <tr key={log.id}>
                    <td>{log.createdAt ? new Date(log.createdAt).toLocaleString("id-ID") : "-"}</td>
                    <td>{log.barang?.nama ?? "-"} ({log.barang?.satuan ?? "-"})</td>
                    <td style={{ color: log.perubahan >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {log.perubahan >= 0 ? "+" : ""}{log.perubahan}
                    </td>
                    <td>{labelJenis(log.jenis)}</td>
                    <td>{log.admin?.nama ?? "-"}</td>
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
