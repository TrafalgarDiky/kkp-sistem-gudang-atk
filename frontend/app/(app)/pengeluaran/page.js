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
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    const tgl = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return `${tgl}, ${jam}`;
  } catch {
    return "—";
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
      const kode = safeText(p.kode).toLowerCase();
      const items = (p.items || [])
        .map((it) => `${safeText(it.barang?.nama)} ${safeText(it.barang?.satuan)} ${it.jumlah}`.toLowerCase())
        .join(" ");
      return (
        peminta.includes(q) ||
        petugas.includes(q) ||
        catatan.includes(q) ||
        kode.includes(q) ||
        items.includes(q)
      );
    });
  }, [list, filter.dari, filter.sampai, filter.q]);

  const detail = detailId ? filtered.find((p) => p.id === detailId) || list.find((p) => p.id === detailId) : null;

  return (
    <main className="app-content">
      {/* ============ TOOLBAR ============ */}
      <div className="list-toolbar">
        <div>
          <h1>Pengeluaran Barang</h1>
          <p className="app-muted" style={{ margin: "0.35rem 0 0" }}>
            Riwayat pengeluaran tercatat otomatis saat permintaan <strong>SELESAI</strong> (stok berkurang).
          </p>
        </div>
        <div className="list-toolbar-spacer" />

        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            placeholder="Cari peminta/petugas/barang..."
          />
          {filter.q && (
            <button
              type="button"
              className="search-box-clear"
              onClick={() => setFilter((f) => ({ ...f, q: "" }))}
              title="Bersihkan"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        <div className="filter-row" title="Filter periode">
          <i className="fa-regular fa-calendar" />
          <input
            type="date"
            value={filter.dari}
            onChange={(e) => setFilter((f) => ({ ...f, dari: e.target.value }))}
            aria-label="Dari"
          />
          <span>—</span>
          <input
            type="date"
            value={filter.sampai}
            onChange={(e) => setFilter((f) => ({ ...f, sampai: e.target.value }))}
            aria-label="Sampai"
          />
          {(filter.dari || filter.sampai) && (
            <button
              type="button"
              className="filter-row-clear"
              onClick={() => setFilter((f) => ({ ...f, dari: "", sampai: "" }))}
              title="Bersihkan periode"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        <div className="list-toolbar-actions">
          <button type="button" className="btn-icon" onClick={fetchPengeluaran} disabled={loading} title="Refresh data">
            <i className="fa-solid fa-rotate" />
            <span>{loading ? "Memuat..." : "Refresh"}</span>
          </button>
          <button
            type="button"
            className="btn-icon"
            title="Export ke CSV"
            onClick={() => {
              const rows = [
                [
                  "Tanggal keluar",
                  "Kode permintaan",
                  "Peminta",
                  "Diantar oleh",
                  "Disetujui oleh",
                  "Barang",
                  "Jumlah",
                  "Satuan",
                  "Catatan",
                ],
              ];
              for (const p of filtered) {
                const petugas = p.tugasPetugas?.[0]?.petugas?.nama ?? "-";
                const approver = p.approver?.nama || "Auto-approve sistem";
                for (const it of p.items || []) {
                  rows.push([
                    toIdDateTime(p.updatedAt),
                    p.kode ?? "",
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
            <i className="fa-solid fa-download" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {error && <p style={{ color: "var(--danger)", marginBottom: "0.5rem" }}>{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="app-muted">Tidak ada data pengeluaran pada filter ini.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Tanggal keluar</th>
                  <th>Kode</th>
                  <th>Peminta</th>
                  <th>Diantar oleh</th>
                  <th>Disetujui oleh</th>
                  <th>Barang/Jumlah</th>
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
                      <td>
                        <span
                          style={{
                            fontFamily: "ui-monospace, monospace",
                            fontSize: "0.82rem",
                          }}
                        >
                          {p.kode ?? "—"}
                        </span>
                      </td>
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
        </>
      )}

      {/* Modal detail */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetailId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Header modal: seragam dengan modal lain */}
            <div className="modal-header">
              <h2>Detail Pengeluaran</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDetailId(null)}
                title="Tutup"
                aria-label="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <p className="modal-subtitle">Ringkasan permintaan yang sudah selesai (stok berkurang).</p>
            <div className="modal-divider" />

            {/* Meta info: grid 2 kolom (lebih rapi) */}
            <div className="detail-meta-grid">
              <div className="detail-meta-item">
                <div className="detail-meta-label">Tanggal keluar</div>
                <div className="detail-meta-value">{toIdDateTime(detail.updatedAt)}</div>
              </div>
              <div className="detail-meta-item">
                <div className="detail-meta-label">Kode permintaan</div>
                <div className="detail-meta-value" style={{ fontFamily: "ui-monospace, monospace" }}>
                  {detail.kode ?? "—"}
                </div>
              </div>
              <div className="detail-meta-item">
                <div className="detail-meta-label">Peminta</div>
                <div className="detail-meta-value">{detail.peminta?.nama ?? "-"}</div>
              </div>
              <div className="detail-meta-item">
                <div className="detail-meta-label">Divisi</div>
                <div className="detail-meta-value">{detail.peminta?.divisi ?? "-"}</div>
              </div>
              <div className="detail-meta-item">
                <div className="detail-meta-label">Diantar oleh</div>
                <div className="detail-meta-value">{detail.tugasPetugas?.[0]?.petugas?.nama ?? "Belum ada"}</div>
              </div>
              <div className="detail-meta-item">
                <div className="detail-meta-label">Disetujui oleh</div>
                <div className="detail-meta-value">{detail.approver?.nama || "Auto-approve sistem"}</div>
              </div>
              <div className="detail-meta-item" style={{ gridColumn: "1 / -1" }}>
                <div className="detail-meta-label">Catatan</div>
                <div className="detail-meta-value">{detail.catatanAdmin || "-"}</div>
              </div>
            </div>

            {/* Items: tetap tabel tapi bungkus card biar serasi */}
            <div className="detail-section-title">Daftar barang keluar</div>
            <div className="table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th style={{ width: 110 }}>Jumlah</th>
                    <th style={{ width: 110 }}>Satuan</th>
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

