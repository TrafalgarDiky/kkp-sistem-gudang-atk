"use client";

/**
 * Tugas Petugas — Admin (read-only monitoring)
 *
 * Fitur:
 * - Toolbar (judul + search peminta/petugas + Export CSV)
 * - Summary strip compact (Menunggu, Sedang diantar, Selesai, Ditolak, Total)
 * - Filter bar (status + periode + reset)
 * - Tabel modern: UserCell untuk peminta & petugas, item count pill + tooltip, status pill
 * - Pagination + empty states ramah
 *
 * Endpoint: GET /api/permintaan/tugas
 */
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { UserCell } from "@/components/ui";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

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

function toIdDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

/**
 * Mapping status enum -> { label, variant }.
 * DALAM_PROSES & SELESAI adalah status legacy, tetap didukung.
 */
function getStatusInfo(status) {
  switch (status) {
    case "MENUNGGU_ASSIGN": return { label: "Menunggu petugas", variant: "warning" };
    case "ON_DELIVERY":     return { label: "Sedang diantar",   variant: "info"    };
    case "DALAM_PROSES":    return { label: "Dalam proses",     variant: "info"    };
    case "DELIVERED":       return { label: "Selesai",          variant: "success" };
    case "SELESAI":         return { label: "Selesai",          variant: "success" };
    case "DITOLAK":         return { label: "Ditolak",          variant: "danger"  };
    default:                return { label: status || "—",      variant: "muted"   };
  }
}

// ====================== Page ======================

export default function AdminTugas() {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // ====================== Fetch ======================

  useEffect(() => {
    setError("");
    setLoading(true);
    fetch(apiUrl("/api/permintaan/tugas"), { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTugas(data.data?.tugas || []);
        else setError(data.message || "Gagal memuat tugas");
      })
      .catch(() => setError("Koneksi gagal."))
      .finally(() => setLoading(false));
  }, []);

  // Reset halaman saat filter/search berubah
  useEffect(() => {
    setPage(1);
  }, [filterStatus, search, dari, sampai, perPage]);

  // ====================== Derived ======================

  /** Filter: status + search (peminta/petugas) + periode (berdasarkan createdAt permintaan) */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dariTs = dari ? new Date(dari).getTime() : null;
    const sampaiTs = sampai ? new Date(sampai + "T23:59:59").getTime() : null;

    return tugas.filter((t) => {
      if (filterStatus && t.statusTugas !== filterStatus) return false;

      if (q) {
        const peminta = (t.permintaan?.peminta?.nama || "").toLowerCase();
        const petugas = (t.petugas?.nama || "").toLowerCase();
        const kode = (t.permintaan?.kode || "").toLowerCase();
        if (!peminta.includes(q) && !petugas.includes(q) && !kode.includes(q))
          return false;
      }

      if (dariTs || sampaiTs) {
        const t0 = t.permintaan?.createdAt ? new Date(t.permintaan.createdAt).getTime() : null;
        if (!t0) return false;
        if (dariTs && t0 < dariTs) return false;
        if (sampaiTs && t0 > sampaiTs) return false;
      }

      return true;
    });
  }, [tugas, filterStatus, search, dari, sampai]);

  /** Stats dari seluruh data (bukan filtered), agar summary selalu konsisten */
  const stats = useMemo(() => {
    let menunggu = 0, diantar = 0, selesai = 0, ditolak = 0;
    for (const t of tugas) {
      if (t.statusTugas === "MENUNGGU_ASSIGN") menunggu++;
      else if (t.statusTugas === "ON_DELIVERY" || t.statusTugas === "DALAM_PROSES") diantar++;
      else if (t.statusTugas === "DELIVERED" || t.statusTugas === "SELESAI") selesai++;
      else if (t.statusTugas === "DITOLAK") ditolak++;
    }
    return { menunggu, diantar, selesai, ditolak, total: tugas.length };
  }, [tugas]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const visible = filtered.slice(startIdx, startIdx + perPage);

  const hasActiveFilter = filterStatus || search || dari || sampai;

  // ====================== Handlers ======================

  const resetFilter = () => {
    setFilterStatus("");
    setSearch("");
    setDari("");
    setSampai("");
  };

  const handleExport = () => {
    const rows = [
      ["Tanggal", "Kode permintaan", "Peminta", "Divisi", "Item (jumlah x nama)", "Petugas", "Status"],
    ];
    for (const t of filtered) {
      const itemsStr = (t.permintaan?.items || [])
        .map((it) => `${it.jumlah} x ${it.barang?.nama ?? "-"}`)
        .join("; ");
      rows.push([
        toIdDate(t.permintaan?.createdAt),
        t.permintaan?.kode ?? "",
        t.permintaan?.peminta?.nama ?? "",
        t.permintaan?.peminta?.divisi ?? "",
        itemsStr,
        t.petugas?.nama ?? "-",
        getStatusInfo(t.statusTugas).label,
      ]);
    }
    downloadCsv(`tugas_petugas_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  // ====================== Render ======================

  return (
    <main className="app-content">
      {/* ============ TOOLBAR ============ */}
      <div className="list-toolbar">
        <h1>Tugas Petugas</h1>
        <div className="list-toolbar-spacer" />

        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Cari peminta, petugas, atau kode (P-0001)..."
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
        Monitoring tugas pengambilan/pengantaran barang oleh petugas. Stok berkurang otomatis saat tugas selesai.
      </p>

      {/* ============ SUMMARY STRIP ============ */}
      <div className="summary-strip">
        <span className="summary-strip-item">
          <span className="summary-strip-dot is-warning" />
          <span className="summary-strip-label">Menunggu</span>
          <span className="summary-strip-value">{stats.menunggu}</span>
        </span>
        <span className="summary-strip-item">
          <span className="summary-strip-dot is-info" />
          <span className="summary-strip-label">Sedang diantar</span>
          <span className="summary-strip-value">{stats.diantar}</span>
        </span>
        <span className="summary-strip-item">
          <span className="summary-strip-dot is-success" />
          <span className="summary-strip-label">Selesai</span>
          <span className="summary-strip-value">{stats.selesai}</span>
        </span>
        <span className="summary-strip-item">
          <span className="summary-strip-dot is-danger" />
          <span className="summary-strip-label">Ditolak</span>
          <span className="summary-strip-value">{stats.ditolak}</span>
        </span>
        <span className="summary-strip-sep" />
        <span className="summary-strip-item">
          <span className="summary-strip-label">Total tugas</span>
          <span className="summary-strip-value">{stats.total}</span>
        </span>
      </div>

      {/* ============ FILTER BAR ============ */}
      <div className="log-filter-bar">
        <div className="log-filter-item">
          <span className="log-filter-label">Status</span>
          <select
            className="log-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua status</option>
            <option value="MENUNGGU_ASSIGN">Menunggu petugas</option>
            <option value="ON_DELIVERY">Sedang diantar</option>
            <option value="DELIVERED">Selesai</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>

        <div className="log-filter-item">
          <span className="log-filter-label">Periode</span>
          <div className="filter-row" title="Filter periode">
            <i className="fa-regular fa-calendar" />
            <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} aria-label="Dari" />
            <span>—</span>
            <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} aria-label="Sampai" />
            {(dari || sampai) && (
              <button
                type="button"
                className="filter-row-clear"
                onClick={() => { setDari(""); setSampai(""); }}
                title="Bersihkan periode"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>

        {hasActiveFilter && (
          <button type="button" className="btn-link-danger" onClick={resetFilter}>
            <i className="fa-solid fa-rotate-left" /> Reset filter
          </button>
        )}
      </div>

      {error && <p className="app-error">{error}</p>}

      {/* ============ TABLE ============ */}
      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : tugas.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-truck-fast" />
          <div className="empty-state-title">Belum ada tugas</div>
          <p className="empty-state-sub">Tugas akan muncul otomatis saat ada permintaan baru dari staff.</p>
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
                  <th style={{ width: 130 }}>Tanggal</th>
                  <th style={{ width: 118 }}>Kode</th>
                  <th>Peminta</th>
                  <th style={{ width: 100, textAlign: "center" }}>Item</th>
                  <th>Petugas</th>
                  <th style={{ width: 180 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const statusInfo = getStatusInfo(t.statusTugas);
                  const items = t.permintaan?.items || [];
                  const itemCount = items.length;
                  const itemsPreview = items
                    .map((it) => `${it.jumlah} x ${it.barang?.nama ?? "-"}`)
                    .join("\n");
                  return (
                    <tr key={t.id}>
                      <td>{toIdDate(t.permintaan?.createdAt)}</td>
                      <td>
                        <span
                          className="pill pill-muted"
                          style={{
                            fontFamily: "ui-monospace, monospace",
                            fontSize: "0.78rem",
                          }}
                        >
                          {t.permintaan?.kode ?? "—"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <UserCell name={t.permintaan?.peminta?.nama} />
                          {t.permintaan?.peminta?.divisi && (
                            <span className="app-muted" style={{ fontSize: "0.78rem", marginLeft: "calc(28px + 0.5rem)" }}>
                              {t.permintaan.peminta.divisi}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }} title={itemsPreview || "Tidak ada item"}>
                        <span className="pill pill-muted" style={{ cursor: "help" }}>
                          {itemCount} item
                        </span>
                      </td>
                      <td>
                        {t.petugas?.nama ? (
                          <UserCell name={t.petugas.nama} />
                        ) : (
                          <span className="app-muted" style={{ fontStyle: "italic" }}>Belum diambil</span>
                        )}
                      </td>
                      <td>
                        <span className={`pill pill-${statusInfo.variant}`}>{statusInfo.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ============ PAGINATION ============ */}
          <div className="pagination">
            <div>
              Menampilkan <strong>{visible.length}</strong> dari <strong>{filtered.length}</strong> entri
              {hasActiveFilter && ` (dari total ${tugas.length})`}
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
