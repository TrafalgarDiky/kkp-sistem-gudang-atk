"use client";

/**
 * Permintaan Masuk — Admin
 *
 * Fitur:
 * - Toolbar modern (judul + search peminta + Export CSV)
 * - Filter bar (status + periode + reset)
 * - 4 stats cards: Diambil/On-Delivery, Selesai, Ditolak, Total
 * - Tabel modern: avatar peminta, item count badge dgn tooltip, status pill, aksi Detail+Tolak
 * - Modal Detail (lebar): info peminta, items list, info petugas, alasan tolak
 * - Modal Tolak modern (close btn, divider, full-width buttons)
 * - Pagination + toast notif
 *
 * Endpoint: GET /api/permintaan, PATCH /api/permintaan/:id/approve
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

function toIdDateTime(dt) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    const tgl = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return `${tgl}, ${jam}`;
  } catch { return "—"; }
}

/**
 * Mapping status permintaan -> { label, pill variant }.
 * Detail tugas petugas dipertimbangkan untuk DISETUJUI_ADMIN.
 */
function getStatusInfo(p) {
  // Special case: dibatalkan oleh staff
  if (
    p.statusAdmin === "DITOLAK_ADMIN" &&
    typeof p.catatanAdmin === "string" &&
    p.catatanAdmin.toLowerCase().startsWith("dibatalkan oleh staff")
  ) {
    return { label: "Dibatalkan staff", variant: "muted" };
  }
  if (p.statusAdmin === "DITOLAK_ADMIN") return { label: "Ditolak", variant: "danger" };
  if (p.statusAdmin === "SELESAI") return { label: "Selesai", variant: "success" };
  if (p.statusAdmin === "DISETUJUI_ADMIN") {
    const tugas = p.tugasPetugas?.[0];
    if (tugas?.petugas) return { label: `Diambil ${tugas.petugas.nama}`, variant: "info" };
    return { label: "Menunggu petugas", variant: "warning" };
  }
  return { label: p.statusAdmin || "—", variant: "muted" };
}

function isAutoApproveNote(note) {
  return typeof note === "string" && note.toLowerCase().startsWith("auto-approve");
}

// ====================== Page ======================

export default function AdminPermintaan() {
  const [permintaan, setPermintaan] = useState([]);
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

  // Modal Tolak
  const [modalTolakOpen, setModalTolakOpen] = useState(false);
  const [targetTolak, setTargetTolak] = useState(null);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modal Detail
  const [detailTarget, setDetailTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // ====================== Fetch ======================

  const fetchPermintaan = async () => {
    setError("");
    try {
      const url = filterStatus
        ? apiUrl(`/api/permintaan?status=${encodeURIComponent(filterStatus)}`)
        : apiUrl("/api/permintaan");
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setPermintaan(data.data?.permintaan || []);
      else setError(data.message || "Gagal memuat permintaan");
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPermintaan();
  }, [filterStatus]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Reset halaman saat filter/search berubah
  useEffect(() => {
    setPage(1);
  }, [filterStatus, search, dari, sampai, perPage]);

  // ====================== Derived ======================

  /** Filter periode + search di sisi client (status di-filter di API) */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dariTs = dari ? new Date(dari).getTime() : null;
    const sampaiTs = sampai ? new Date(sampai + "T23:59:59").getTime() : null;

    return permintaan.filter((p) => {
      // Search: nama peminta atau divisi
      if (q) {
        const nama = (p.peminta?.nama || "").toLowerCase();
        const divisi = (p.peminta?.divisi || "").toLowerCase();
        const kode = (p.kode || "").toLowerCase();
        if (!nama.includes(q) && !divisi.includes(q) && !kode.includes(q))
          return false;
      }
      // Periode (createdAt)
      if (dariTs || sampaiTs) {
        const t = p.createdAt ? new Date(p.createdAt).getTime() : null;
        if (!t) return false;
        if (dariTs && t < dariTs) return false;
        if (sampaiTs && t > sampaiTs) return false;
      }
      return true;
    });
  }, [permintaan, search, dari, sampai]);

  /** Stats dihitung dari permintaan total (BUKAN dari filtered), supaya angka summary stabil */
  const stats = useMemo(() => {
    let onDelivery = 0, selesai = 0, ditolak = 0;
    for (const p of permintaan) {
      if (p.statusAdmin === "SELESAI") selesai++;
      else if (p.statusAdmin === "DITOLAK_ADMIN") ditolak++;
      else if (p.statusAdmin === "DISETUJUI_ADMIN") onDelivery++;
    }
    return { onDelivery, selesai, ditolak, total: permintaan.length };
  }, [permintaan]);

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

  const openTolak = (p) => {
    setTargetTolak(p);
    setAlasanTolak("");
    setError("");
    setModalTolakOpen(true);
  };
  const closeTolak = () => {
    if (submitLoading) return;
    setModalTolakOpen(false);
    setTargetTolak(null);
    setAlasanTolak("");
  };

  const canTolak = (p) => {
    if (!p) return false;
    if (p.statusAdmin === "SELESAI") return false;
    if (p.statusAdmin === "DITOLAK_ADMIN") return false;
    return true;
  };

  const submitTolak = async (e) => {
    e?.preventDefault();
    if (!targetTolak?.id) return;
    const alasan = (alasanTolak || "").trim();
    if (!alasan) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/permintaan/${targetTolak.id}/approve`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DITOLAK_ADMIN", catatanAdmin: alasan }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setToast({ variant: "success", message: `Permintaan dari ${targetTolak.peminta?.nama ?? "user"} ditolak.` });
        closeTolak();
        fetchPermintaan();
      } else {
        setError(data.message || "Gagal menolak permintaan");
      }
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleExport = () => {
    const rows = [
      [
        "Tanggal",
        "Kode permintaan",
        "Peminta",
        "Divisi",
        "Status",
        "Barang",
        "Jumlah",
        "Satuan",
        "Catatan",
        "Petugas",
      ],
    ];
    for (const p of filtered) {
      const petugas = p.tugasPetugas?.[0]?.petugas?.nama ?? "-";
      const prefix = [
        toIdDate(p.createdAt),
        p.kode ?? "",
        p.peminta?.nama ?? "",
        p.peminta?.divisi ?? "",
        getStatusInfo(p).label,
      ];
      const catatan = p.catatanAdmin ?? "";
      const items = p.items || [];
      if (items.length === 0) {
        rows.push([...prefix, "", "", "", catatan, petugas]);
      } else {
        for (const it of items) {
          rows.push([
            ...prefix,
            it.barang?.nama ?? "-",
            String(it.jumlah ?? ""),
            it.barang?.satuan ?? "",
            catatan,
            petugas,
          ]);
        }
      }
    }
    downloadCsv(`permintaan_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setToast({ variant: "info", message: "File CSV sedang diunduh." });
  };

  // ====================== Render ======================

  return (
    <main className="app-content">
      {/* ============ TOOLBAR ============ */}
      <div className="list-toolbar">
        <h1>Permintaan Masuk</h1>
        <div className="list-toolbar-spacer" />

        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Cari peminta, divisi, atau kode (P-0001)..."
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
        Monitoring permintaan ATK dari staff. Sistem auto-approve, admin bisa menolak sebelum tugas selesai.
      </p>

      {/* ============ SUMMARY STRIP (compact, bukan dashboard cards) ============ */}
      <div className="summary-strip">
        <span className="summary-strip-item">
          <span className="summary-strip-dot is-warning" />
          <span className="summary-strip-label">Diproses</span>
          <span className="summary-strip-value">{stats.onDelivery}</span>
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
          <span className="summary-strip-label">Total permintaan</span>
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
            <option value="DISETUJUI_ADMIN">Disetujui / Diproses</option>
            <option value="SELESAI">Selesai</option>
            <option value="DITOLAK_ADMIN">Ditolak / Dibatalkan</option>
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
      ) : permintaan.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-clipboard-list" />
          <div className="empty-state-title">Belum ada permintaan</div>
          <p className="empty-state-sub">Permintaan baru dari staff akan muncul di sini secara otomatis.</p>
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
                  <th style={{ width: 120 }}>Kode</th>
                  <th>Peminta</th>
                  <th style={{ width: 100, textAlign: "center" }}>Item</th>
                  <th style={{ width: 200 }}>Status</th>
                  <th>Catatan</th>
                  <th style={{ width: 130, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const statusInfo = getStatusInfo(p);
                  const itemCount = p.items?.length ?? 0;
                  const itemsPreview = (p.items || [])
                    .map((it) => `${it.jumlah} x ${it.barang?.nama ?? "-"}`)
                    .join("\n");
                  const noteIsAuto = isAutoApproveNote(p.catatanAdmin);
                  return (
                    <tr key={p.id}>
                      <td>{toIdDate(p.createdAt)}</td>
                      <td>
                        <span
                          className="pill pill-muted"
                          style={{
                            fontFamily: "ui-monospace, monospace",
                            fontSize: "0.78rem",
                          }}
                        >
                          {p.kode ?? "—"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <UserCell name={p.peminta?.nama} />
                          {p.peminta?.divisi && (
                            <span className="app-muted" style={{ fontSize: "0.78rem", marginLeft: "calc(28px + 0.5rem)" }}>
                              {p.peminta.divisi}
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
                        <span className={`pill pill-${statusInfo.variant}`}>{statusInfo.label}</span>
                      </td>
                      <td>
                        {p.catatanAdmin ? (
                          noteIsAuto ? (
                            <span className="app-muted" title={p.catatanAdmin}>
                              <i className="fa-solid fa-robot" /> Auto
                            </span>
                          ) : (
                            <span className="text-truncate" title={p.catatanAdmin} style={{ maxWidth: 220 }}>
                              {p.catatanAdmin}
                            </span>
                          )
                        ) : (
                          <span className="app-muted">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="row-actions">
                          <button
                            type="button"
                            className="icon-btn icon-btn-edit"
                            onClick={() => setDetailTarget(p)}
                            title="Lihat detail"
                          >
                            <i className="fa-solid fa-eye" />
                          </button>
                          {canTolak(p) && (
                            <button
                              type="button"
                              className="icon-btn icon-btn-danger"
                              onClick={() => openTolak(p)}
                              title="Tolak permintaan"
                            >
                              <i className="fa-solid fa-ban" />
                            </button>
                          )}
                        </span>
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
              {hasActiveFilter && ` (dari total ${permintaan.length})`}
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

      {/* ============ MODAL: DETAIL ============ */}
      {detailTarget && (() => {
        const p = detailTarget;
        const statusInfo = getStatusInfo(p);
        const tugas = p.tugasPetugas?.[0];
        const noteIsAuto = isAutoApproveNote(p.catatanAdmin);
        return (
          <div className="modal-overlay" onClick={() => setDetailTarget(null)}>
            <div className="modal-box modal-box-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detail Permintaan</h2>
                <button type="button" className="modal-close" onClick={() => setDetailTarget(null)} title="Tutup">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <p className="modal-subtitle">
                Dibuat <strong>{toIdDateTime(p.createdAt)}</strong>
              </p>
              <div className="modal-divider" />

              {/* Meta info grid */}
              <div className="detail-meta-grid">
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Kode permintaan</span>
                  <span className="detail-meta-value" style={{ fontFamily: "ui-monospace, monospace" }}>
                    {p.kode ?? "—"}
                  </span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Peminta</span>
                  <span className="detail-meta-value">
                    <UserCell name={p.peminta?.nama} />
                  </span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Divisi</span>
                  <span className="detail-meta-value">{p.peminta?.divisi || "—"}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Status</span>
                  <span className="detail-meta-value">
                    <span className={`pill pill-${statusInfo.variant}`}>{statusInfo.label}</span>
                  </span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Petugas</span>
                  <span className="detail-meta-value">
                    {tugas?.petugas ? (
                      <UserCell name={tugas.petugas.nama} />
                    ) : (
                      <span className="app-muted">Belum diambil</span>
                    )}
                  </span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Email peminta</span>
                  <span className="detail-meta-value">{p.peminta?.email || "—"}</span>
                </div>
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Update terakhir</span>
                  <span className="detail-meta-value">{toIdDateTime(p.updatedAt)}</span>
                </div>
              </div>

              {/* Items list */}
              <div className="detail-section-title">Daftar Item ({p.items?.length || 0})</div>
              {p.items?.length ? (
                <div className="detail-items-list">
                  {p.items.map((it) => (
                    <div key={it.id} className="detail-item-row">
                      <span className="detail-item-name">
                        {it.barang?.nama || "—"} <small>({it.barang?.satuan || "-"})</small>
                      </span>
                      <span className="detail-item-qty">{it.jumlah}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="app-muted" style={{ fontSize: "0.85rem", marginBottom: "0.85rem" }}>
                  Tidak ada item.
                </p>
              )}

              {/* Catatan admin */}
              {p.catatanAdmin && !noteIsAuto && (
                <>
                  <div className="detail-section-title">Catatan</div>
                  <div className="detail-meta-grid" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="detail-meta-value">{p.catatanAdmin}</div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="modal-actions-block">
                <button type="button" className="btn-secondary" onClick={() => setDetailTarget(null)}>
                  Tutup
                </button>
                {canTolak(p) ? (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => { setDetailTarget(null); openTolak(p); }}
                  >
                    <i className="fa-solid fa-ban" /> Tolak Permintaan
                  </button>
                ) : (
                  <button type="button" className="btn-primary" disabled>
                    Tidak ada aksi
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ MODAL: TOLAK ============ */}
      {modalTolakOpen && targetTolak && (
        <div className="modal-overlay" onClick={closeTolak}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tolak Permintaan</h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeTolak}
                disabled={submitLoading}
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <p className="modal-subtitle">
              Permintaan dari <strong>{targetTolak.peminta?.nama ?? "-"}</strong>. Alasan akan tercatat sebagai catatan admin.
            </p>
            <div className="modal-divider" />

            <form onSubmit={submitTolak}>
              <label>Alasan penolakan <span className="required">*</span></label>
              <textarea
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Contoh: stok tidak mencukupi / permintaan tidak sesuai / dsb"
                style={{ width: "100%", minHeight: 100, resize: "vertical" }}
                autoFocus
              />

              {error && (
                <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>
              )}

              <div className="modal-actions-block">
                <button type="button" className="btn-secondary" onClick={closeTolak} disabled={submitLoading}>
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Memproses..." : "Tolak Permintaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ TOAST ============ */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast toast-${toast.variant}`}>
            <span className="toast-icon">
              <i className={`fa-solid ${
                toast.variant === "success" ? "fa-check"
                : toast.variant === "error" ? "fa-xmark"
                : "fa-info"
              }`} />
            </span>
            <span>{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => setToast(null)} title="Tutup">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
