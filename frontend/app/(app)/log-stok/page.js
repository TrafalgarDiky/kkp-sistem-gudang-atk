"use client";

/**
 * Log Stok (Audit) — Admin
 * - Daftar semua perubahan stok: Restock (+), Permintaan disetujui (-), Penyesuaian (±)
 * - Filter: barang (combobox dengan search), periode, jenis
 * - Search keyword (di sisi client) + pagination
 * - Export CSV hasil yang difilter
 *
 * Endpoint: GET /api/log-stok?barangId=&dari=&sampai=&jenis=
 */
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { UserCell, BarangCombobox } from "@/components/ui";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const JENIS_LABEL = {
  RESTOCK: "Restock",
  APPROVE: "Permintaan disetujui",
  PENYESUAIAN: "Penyesuaian",
};

/** Mapping jenis -> warna pill */
const JENIS_PILL = {
  RESTOCK: "success",
  APPROVE: "info",
  PENYESUAIAN: "warning",
};

// ====================== Helpers ======================

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

/** Format datetime ID singkat: "13 Apr 2026, 09:32" */
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

// ====================== Page ======================

export default function LogStokPage() {
  const [user, setUser] = useState(null);
  const [barang, setBarang] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter (dipake ke API)
  const [filter, setFilter] = useState({ barangId: "", dari: "", sampai: "", jenis: "" });

  // Search keyword (client-side, sebagai filter tambahan)
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // ====================== Effects ======================

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) { try { setUser(JSON.parse(raw)); } catch (_) {} }
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

  // Reset halaman saat filter/search berubah
  useEffect(() => {
    setPage(1);
  }, [filter.barangId, filter.dari, filter.sampai, filter.jenis, search, perPage]);

  // ====================== Filtering & Pagination ======================

  /** Search keyword tambahan (di nama barang, kode, atau nama admin) */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((log) => {
      const nama = (log.barang?.nama || "").toLowerCase();
      const kode = (log.barang?.kode || "").toLowerCase();
      const admin = (log.admin?.nama || "").toLowerCase();
      return nama.includes(q) || kode.includes(q) || admin.includes(q);
    });
  }, [list, search]);

  /** Hitung total qty masuk vs keluar (dari hasil filter) */
  const summary = useMemo(() => {
    let masuk = 0, keluar = 0;
    for (const log of filtered) {
      const v = Number(log.perubahan) || 0;
      if (v > 0) masuk += v; else keluar += Math.abs(v);
    }
    return { masuk, keluar };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const visible = filtered.slice(startIdx, startIdx + perPage);

  const hasActiveFilter =
    filter.barangId || filter.dari || filter.sampai || filter.jenis || search;

  // ====================== Handlers ======================

  const resetFilter = () => {
    setFilter({ barangId: "", dari: "", sampai: "", jenis: "" });
    setSearch("");
  };

  const handleExport = () => {
    const rows = [["Waktu", "Barang", "Satuan", "Perubahan", "Jenis", "Oleh"]];
    for (const log of filtered) {
      rows.push([
        toIdDateTime(log.createdAt),
        log.barang?.nama ?? "",
        log.barang?.satuan ?? "",
        String(log.perubahan ?? ""),
        JENIS_LABEL[log.jenis] || log.jenis || "",
        log.admin?.nama ?? "",
      ]);
    }
    downloadCsv(`log_stok_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  // ====================== Guards ======================

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Log Stok</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  // ====================== Render ======================

  return (
    <main className="app-content">
      {/* ============ TOOLBAR ============ */}
      <div className="list-toolbar">
        <h1>Log Stok</h1>
        <div className="list-toolbar-spacer" />

        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Cari barang atau admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-box-clear" onClick={() => setSearch("")} title="Bersihkan">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        <div className="list-toolbar-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={handleExport}
            disabled={!filtered.length}
            title="Export ke CSV"
          >
            <i className="fa-solid fa-download" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <p className="app-muted" style={{ marginTop: "-0.5rem", marginBottom: "1rem", fontSize: "0.88rem" }}>
        Jejak semua perubahan stok: penambahan (Restock), pengurangan (Permintaan disetujui), dan koreksi manual (Penyesuaian).
      </p>

      {/* ============ FILTER BAR ============ */}
      <div className="log-filter-bar">
        <div className="log-filter-item" style={{ minWidth: 240 }}>
          <span className="log-filter-label">Barang</span>
          <BarangCombobox
            items={barang}
            value={filter.barangId}
            onChange={(id) => setFilter((f) => ({ ...f, barangId: id }))}
            allowEmpty
            emptyLabel="Semua barang"
          />
        </div>

        <div className="log-filter-item">
          <span className="log-filter-label">Periode</span>
          <div className="filter-row" title="Filter periode">
            <i className="fa-regular fa-calendar" />
            <input type="date" value={filter.dari} onChange={(e) => setFilter((f) => ({ ...f, dari: e.target.value }))} aria-label="Dari" />
            <span>—</span>
            <input type="date" value={filter.sampai} onChange={(e) => setFilter((f) => ({ ...f, sampai: e.target.value }))} aria-label="Sampai" />
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
        </div>

        <div className="log-filter-item">
          <span className="log-filter-label">Jenis</span>
          <select
            className="log-filter-select"
            value={filter.jenis}
            onChange={(e) => setFilter((f) => ({ ...f, jenis: e.target.value }))}
          >
            <option value="">Semua jenis</option>
            <option value="RESTOCK">Restock</option>
            <option value="APPROVE">Permintaan disetujui</option>
            <option value="PENYESUAIAN">Penyesuaian</option>
          </select>
        </div>

        {hasActiveFilter && (
          <button type="button" className="btn-link-danger" onClick={resetFilter}>
            <i className="fa-solid fa-rotate-left" /> Reset filter
          </button>
        )}
      </div>

      {error && <p className="app-error">{error}</p>}

      {/* ============ TABEL ============ */}
      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-clock-rotate-left" />
          <div className="empty-state-title">Belum ada perubahan stok</div>
          <p className="empty-state-sub">Log akan otomatis terisi saat ada restock, permintaan disetujui, atau penyesuaian.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-magnifying-glass" />
          <div className="empty-state-title">Tidak ada hasil</div>
          <p className="empty-state-sub">Coba ubah filter atau bersihkan kata kunci.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>Waktu</th>
                  <th>Barang</th>
                  <th style={{ width: 120 }}>Perubahan</th>
                  <th style={{ width: 200 }}>Jenis</th>
                  <th>Dicatat oleh</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((log) => {
                  const v = Number(log.perubahan) || 0;
                  const sign = v >= 0 ? "+" : "";
                  const pillVar = v >= 0 ? "success" : "danger";
                  const jenisVar = JENIS_PILL[log.jenis] || "muted";
                  return (
                    <tr key={log.id}>
                      <td>{toIdDateTime(log.createdAt)}</td>
                      <td>
                        {log.barang?.nama || "—"}{" "}
                        <span className="app-muted">({log.barang?.satuan || "-"})</span>
                      </td>
                      <td>
                        <span className={`pill pill-${pillVar}`}>{sign}{v}</span>
                      </td>
                      <td>
                        <span className={`pill pill-${jenisVar}`}>
                          {JENIS_LABEL[log.jenis] || log.jenis || "—"}
                        </span>
                      </td>
                      <td><UserCell name={log.admin?.nama} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ============ FOOTER PAGINATION ============ */}
          <div className="pagination">
            <div>
              Menampilkan <strong>{visible.length}</strong> dari <strong>{filtered.length}</strong> entri
              {hasActiveFilter && ` (dari total ${list.length})`}
              &nbsp;•&nbsp;
              <span style={{ color: "#047857" }}>Masuk: <strong>+{summary.masuk}</strong></span>
              {" / "}
              <span style={{ color: "#b91c1c" }}>Keluar: <strong>-{summary.keluar}</strong></span>
            </div>
            <div className="pagination-controls">
              <label>
                Per halaman:&nbsp;
                <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                  {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button type="button" className="btn-icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} title="Sebelumnya">
                <i className="fa-solid fa-chevron-left" />
              </button>
              <span>{safePage} / {totalPages}</span>
              <button type="button" className="btn-icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} title="Berikutnya">
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
