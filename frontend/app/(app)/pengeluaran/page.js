"use client";

/**
 * Pengeluaran Barang (Admin)
 * URL: /pengeluaran
 *
 * Apa tujuan bagian ini?
 * - Menyediakan halaman "Riwayat pengeluaran" sesuai menu sidebar.
 *
 * Apa input?
 * - Role user dari localStorage.
 *
 * Apa output?
 * - Halaman ringkas + tautan ke laporan/log yang sudah ada, sambil menunggu API khusus pengeluaran.
 *
 * Kenapa pakai cara ini?
 * - Backend/API "pengeluaran" belum terlihat di frontend saat ini, tapi data pemakaian sudah ada
 *   di `Laporan` dan jejak perubahan stok ada di `Log Stok`. Jadi kita beri entry point yang jelas
 *   tanpa bikin user mentok 404.
 */

import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

function toIdDateTime(dt) {
  try {
    return dt ? new Date(dt).toLocaleString("id-ID") : "-";
  } catch {
    return "-";
  }
}

function safeText(v) {
  return (v ?? "").toString().trim();
}

function formatNamaDivisi(userObj) {
  const nama = safeText(userObj?.nama) || "-";
  const divisi = safeText(userObj?.divisi);
  return divisi ? `${nama} (${divisi})` : nama;
}

function downloadCsv(filename, rows) {
  // rows: string[][]
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

export default function PengeluaranPage() {
  const [user, setUser] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ dari: "", sampai: "", q: "" });
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  if (user && user.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Pengeluaran Barang</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  const fetchPengeluaran = async () => {
    setLoading(true);
    setError("");
    try {
      // Pengeluaran = permintaan yang sudah SELESAI (stok sudah dikurangi)
      const url = apiUrl("/api/permintaan?status=SELESAI");
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json().catch(() => ({}));
      if (json.success) setList(json.data?.permintaan || []);
      else setError(json.message || "Gagal memuat pengeluaran");
    } catch (_) {
      setError("Koneksi gagal. Pastikan backend hidup.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchPengeluaran();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const filtered = useMemo(() => {
    const q = safeText(filter.q).toLowerCase();
    const dari = filter.dari ? new Date(filter.dari) : null;
    const sampai = filter.sampai ? new Date(filter.sampai) : null;
    if (sampai) sampai.setHours(23, 59, 59, 999);

    return (list || []).filter((p) => {
      const waktu = p.updatedAt ? new Date(p.updatedAt) : null;
      if (dari && waktu && waktu < dari) return false;
      if (sampai && waktu && waktu > sampai) return false;

      if (!q) return true;
      const peminta = safeText(p.peminta?.nama).toLowerCase();
      const petugas = safeText(p.tugasPetugas?.[0]?.petugas?.nama).toLowerCase();
      const catatan = safeText(p.catatanAdmin).toLowerCase();
      const items = (p.items || [])
        .map((it) => `${safeText(it.barang?.nama)} ${safeText(it.barang?.satuan)} ${it.jumlah}`.toLowerCase())
        .join(" ");
      return (
        peminta.includes(q) ||
        petugas.includes(q) ||
        catatan.includes(q) ||
        items.includes(q)
      );
    });
  }, [list, filter.dari, filter.sampai, filter.q]);

  const detail = detailId ? filtered.find((p) => p.id === detailId) || list.find((p) => p.id === detailId) : null;

  return (
    <main className="app-content">
      <h1>Pengeluaran Barang</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Riwayat pengeluaran tercatat otomatis saat permintaan <strong>SELESAI</strong> (stok berkurang).
      </p>

      {/* Toolbar filter */}
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1rem",
          alignItems: "flex-end",
        }}
      >
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
        <label style={{ flex: "1 1 260px" }}>
          Cari (peminta/petugas/barang)
          <input
            type="text"
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            placeholder="mis. kertas, andi, budi..."
            style={{ width: "100%", marginTop: "0.25rem", padding: "0.45rem" }}
          />
        </label>
        <button type="button" className="btn btn-secondary" onClick={fetchPengeluaran} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            const rows = [
              ["Tanggal keluar", "Peminta", "Diantar oleh", "Disetujui oleh", "Barang", "Jumlah", "Satuan", "Catatan"],
            ];
            for (const p of filtered) {
              const petugas = p.tugasPetugas?.[0]?.petugas?.nama ?? "-";
              const approver = p.approver?.nama || "Auto-approve sistem";
              for (const it of p.items || []) {
                rows.push([
                  toIdDateTime(p.updatedAt),
                  formatNamaDivisi(p.peminta),
                  petugas,
                  approver,
                  it.barang?.nama ?? "-",
                  String(it.jumlah ?? ""),
                  it.barang?.satuan ?? "-",
                  p.catatanAdmin || "",
                ]);
              }
            }
            downloadCsv(`pengeluaran_${new Date().toISOString().slice(0, 10)}.csv`, rows);
          }}
          disabled={loading || filtered.length === 0}
        >
          Export CSV
        </button>
      </form>

      {error && <p style={{ color: "var(--danger)", marginBottom: "0.5rem" }}>{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="app-muted">Tidak ada data pengeluaran pada filter ini.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th>Tanggal keluar</th>
                <th>Peminta</th>
                <th>Diantar oleh</th>
                <th>Disetujui oleh</th>
                <th>Barang (ringkas)</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const petugas = p.tugasPetugas?.[0]?.petugas?.nama ?? "—";
                const approver = p.approver?.nama || "Auto-approve sistem";
                const ringkas = (p.items || [])
                  .slice(0, 2)
                  .map((it) => `${it.barang?.nama ?? "-"} × ${it.jumlah}`)
                  .join(", ");
                const more = (p.items || []).length > 2 ? ` (+${(p.items || []).length - 2} item)` : "";
                return (
                  <tr key={p.id}>
                    <td>{toIdDateTime(p.updatedAt)}</td>
                    <td>{formatNamaDivisi(p.peminta)}</td>
                    <td>{petugas}</td>
                    <td>{approver}</td>
                    <td>{ringkas}{more}</td>
                    <td>
                      <button type="button" className="btn-sm btn-edit" onClick={() => setDetailId(p.id)}>
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detail */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetailId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Detail Pengeluaran</h2>
            <p><strong>Tanggal keluar:</strong> {toIdDateTime(detail.updatedAt)}</p>
            <p><strong>Peminta:</strong> {detail.peminta?.nama ?? "-"}</p>
            <p><strong>Divisi:</strong> {detail.peminta?.divisi ?? "-"}</p>
            <p><strong>Diantar oleh:</strong> {detail.tugasPetugas?.[0]?.petugas?.nama ?? "Belum ada"}</p>
            <p><strong>Disetujui oleh:</strong> {detail.approver?.nama || "Auto-approve sistem"}</p>
            <p><strong>Catatan:</strong> {detail.catatanAdmin || "-"}</p>

            <p style={{ marginTop: "0.75rem" }}><strong>Daftar barang keluar</strong></p>
            <div style={{ overflowX: "auto" }}>
              <table className="app-table" style={{ width: "100%", fontSize: "0.9rem" }}>
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Jumlah</th>
                    <th>Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((it) => (
                    <tr key={it.id}>
                      <td>{it.barang?.nama ?? "-"}</td>
                      <td>{it.jumlah}</td>
                      <td>{it.barang?.satuan ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="btn-secondary" onClick={() => setDetailId(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

