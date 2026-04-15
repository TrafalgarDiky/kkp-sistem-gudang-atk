"use client";

/**
 * Laporan — Admin: rekap permintaan selesai & pemakaian per barang per periode.
 * GET /api/laporan?dari=&sampai=
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

function toIdDate(dt) {
  try {
    return dt ? new Date(dt).toLocaleDateString("id-ID") : "-";
  } catch {
    return "-";
  }
}

function downloadCsv(filename, rows) {
  const escape = (s) => {
    const str = (s ?? "").toString();
    if (/[",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
    return str;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function LaporanPage() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [pemasukan, setPemasukan] = useState([]);
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
      const [lapRes, inRes] = await Promise.all([
        fetch(apiUrl("/api/laporan" + (q ? "?" + q : "")), { headers: getAuthHeaders() }),
        fetch(apiUrl("/api/restock"), { headers: getAuthHeaders() }),
      ]);
      const json = await lapRes.json();
      const inJson = await inRes.json().catch(() => ({}));
      if (json.success) setData(json.data);
      else setError(json.message || "Gagal memuat laporan");
      if (inJson.success) setPemasukan(inJson.data?.list || []);
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

  // Filter pemasukan (restock) di sisi frontend, karena endpoint /api/restock belum punya filter tanggal.
  const pemasukanFiltered = pemasukan.filter((s) => {
    const t = s?.tanggal ? new Date(s.tanggal) : s?.createdAt ? new Date(s.createdAt) : null;
    if (!t) return true;
    if (filter.dari) {
      const d = new Date(filter.dari);
      if (t < d) return false;
    }
    if (filter.sampai) {
      const s2 = new Date(filter.sampai);
      s2.setHours(23, 59, 59, 999);
      if (t > s2) return false;
    }
    return true;
  });

  const totalQtyMasuk = pemasukanFiltered.reduce((acc, r) => acc + (Number(r.jumlah) || 0), 0);
  const totalQtyKeluar = pemakaian.reduce((acc, p) => acc + (Number(p.totalQty) || 0), 0);

  return (
    <main className="app-content">
      <h1>Laporan</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Rekap pemasukan (stok masuk) & pengeluaran (permintaan selesai) per periode, plus barang paling sering diminta.
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
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading || (!permintaan.length && !pemasukanFiltered.length)}
          onClick={() => {
            // Export spreadsheet = CSV (bisa dibuka di Excel/Google Sheets)
            const rows = [["Jenis", "Tanggal", "Barang", "Jumlah", "Satuan", "Sumber/Peminta", "Petugas/Admin"]];

            // Pemasukan
            for (const r of pemasukanFiltered) {
              rows.push([
                "PEMASUKAN",
                toIdDate(r.tanggal || r.createdAt),
                r.barang?.nama ?? "-",
                String(r.jumlah ?? ""),
                r.barang?.satuan ?? "-",
                r.sumber ?? "-",
                r.admin?.nama ?? "-",
              ]);
            }
            // Pengeluaran (permintaan selesai)
            for (const p of permintaan) {
              const pemintaNama = p.peminta?.nama ?? "-";
              const pemintaDivisi = p.peminta?.divisi ? ` (${p.peminta.divisi})` : "";
              const petugasNama = p.tugasPetugas?.[0]?.petugas?.nama ?? "-";
              const adminNama = p.approver?.nama || "Auto-approve sistem";
              for (const it of p.items || []) {
                rows.push([
                  "PENGELUARAN",
                  toIdDate(p.updatedAt),
                  it.barang?.nama ?? "-",
                  String(it.jumlah ?? ""),
                  it.barang?.satuan ?? "-",
                  `${pemintaNama}${pemintaDivisi}`,
                  `${adminNama} / ${petugasNama}`,
                ]);
              }
            }

            downloadCsv(`laporan_${new Date().toISOString().slice(0, 10)}.csv`, rows);
          }}
        >
          Export Spreadsheet (CSV)
        </button>
      </form>

      {error && <p style={{ color: "var(--danger)", marginBottom: "0.5rem" }}>{error}</p>}

      <section style={{ marginBottom: "1.25rem" }}>
        <div className="stats-grid">
          <div className="stats-card" style={{ "--accent": "#22c55e", "--accent-soft": "#ecfdf5" }}>
            <div className="stats-card-head">
              <span className="stats-icon"><i className="fa-solid fa-arrow-down" /></span>
              <div className="stats-value">{totalQtyMasuk}</div>
            </div>
            <div className="stats-label">Total masuk (qty)</div>
          </div>
          <div className="stats-card" style={{ "--accent": "#ef4444", "--accent-soft": "#fef2f2" }}>
            <div className="stats-card-head">
              <span className="stats-icon"><i className="fa-solid fa-arrow-up" /></span>
              <div className="stats-value">{totalQtyKeluar}</div>
            </div>
            <div className="stats-label">Total keluar (qty)</div>
          </div>
          <div className="stats-card" style={{ "--accent": "#3b82f6", "--accent-soft": "#eff6ff" }}>
            <div className="stats-card-head">
              <span className="stats-icon"><i className="fa-solid fa-clipboard-check" /></span>
              <div className="stats-value">{totalPermintaan}</div>
            </div>
            <div className="stats-label">Permintaan selesai</div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Rekap pemasukan (stok masuk)</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Barang</th>
                <th>Jumlah</th>
                <th>Sumber</th>
                <th>Dicatat oleh</th>
              </tr>
            </thead>
            <tbody>
              {pemasukanFiltered.length === 0 ? (
                <tr><td colSpan={5} className="app-muted">Tidak ada data pemasukan.</td></tr>
              ) : (
                pemasukanFiltered.map((r) => (
                  <tr key={r.id}>
                    <td>{toIdDate(r.tanggal || r.createdAt)}</td>
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
        <p className="app-muted" style={{ marginTop: "0.5rem" }}>
          Catatan: filter periode di atas diterapkan di sisi frontend untuk pemasukan.
        </p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Barang paling sering diminta (pengeluaran)</h2>
        <p className="app-muted" style={{ marginBottom: "0.5rem" }}>
          Urutan berdasarkan total qty keluar pada periode terpilih.
        </p>
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
