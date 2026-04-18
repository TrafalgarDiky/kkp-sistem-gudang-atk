"use client";

/**
 * Permintaan Saya — Staff
 *
 * Fitur modern:
 * - Summary strip compact (Menunggu, Disetujui, Diantar, Sudah sampai, Ditolak)
 * - Filter bar (status + periode dari–sampai + reset)
 * - Tabel: tanggal lokal, status pill, item count + tooltip, petugas UserCell
 * - Modal Detail lebar dgn detail-meta-grid + daftar barang
 * - Modal konfirmasi Batalkan (ganti window.confirm)
 * - Toast notif (sukses / gagal)
 *
 * Endpoint:
 * - GET  /api/permintaan
 * - PATCH /api/permintaan/:id/batal
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { UserCell } from "@/components/ui";

/**
 * Set status filter yang valid supaya hanya nilai aman yang bisa
 * dipakai dari URL query (?status=...).
 */
const VALID_STATUS_KEYS = new Set([
  "MENUNGGU",
  "DISETUJUI",
  "DIANTAR",
  "SELESAI",
  "DITOLAK",
  "DIBATALKAN",
]);

// ====================== Helpers ======================

function toIdDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function toIdDateTime(dt) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    const tgl = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const jam = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${tgl}, ${jam}`;
  } catch {
    return "—";
  }
}

/**
 * Mapping status permintaan → { label, variant, key } dari perspektif Staff.
 * - MENUNGGU_ADMIN                             → Menunggu    (warning)
 * - DISETUJUI_ADMIN + belum ada petugas        → Disetujui   (success)
 * - DISETUJUI_ADMIN + sudah ada petugas        → Diantar     (info)
 * - SELESAI                                    → Sudah sampai (success)
 * - DITOLAK_ADMIN + catatan "dibatalkan oleh staff" → Dibatalkan (muted)
 * - DITOLAK_ADMIN biasa                        → Ditolak     (danger)
 */
function getStatusInfo(p) {
  if (p.statusAdmin === "MENUNGGU_ADMIN") {
    return { label: "Menunggu", variant: "warning", key: "MENUNGGU" };
  }
  if (p.statusAdmin === "DITOLAK_ADMIN") {
    const note =
      typeof p.catatanAdmin === "string" ? p.catatanAdmin.toLowerCase() : "";
    if (note.startsWith("dibatalkan oleh staff")) {
      return { label: "Dibatalkan", variant: "muted", key: "DIBATALKAN" };
    }
    return { label: "Ditolak", variant: "danger", key: "DITOLAK" };
  }
  if (p.statusAdmin === "SELESAI") {
    return { label: "Sudah sampai", variant: "success", key: "SELESAI" };
  }
  if (p.statusAdmin === "DISETUJUI_ADMIN") {
    if (p.tugasPetugas?.[0]?.petugas) {
      return { label: "Diantar", variant: "info", key: "DIANTAR" };
    }
    return { label: "Disetujui", variant: "success", key: "DISETUJUI" };
  }
  return { label: p.statusAdmin || "—", variant: "muted", key: "OTHER" };
}

// ====================== Page ======================

export default function StaffPermintaan() {
  const [permintaan, setPermintaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();

  const [filterStatus, setFilterStatus] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  /**
   * Baca ?status=XXX dari URL saat halaman ini dibuka (mis. dari Dashboard
   * klik stat card). Hanya terima nilai yang ada di VALID_STATUS_KEYS.
   */
  useEffect(() => {
    const fromUrl = searchParams.get("status");
    if (fromUrl && VALID_STATUS_KEYS.has(fromUrl)) {
      setFilterStatus(fromUrl);
    }
  }, [searchParams]);

  // Modal
  const [detailId, setDetailId] = useState(null);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPermintaan = async () => {
    setError("");
    try {
      const res = await fetch(apiUrl("/api/permintaan"), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setPermintaan(data.data?.permintaan || []);
      else setError(data.message || "Gagal memuat permintaan");
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPermintaan();
  }, []);

  // Derived: stats untuk summary strip
  const stats = useMemo(() => {
    const s = {
      menunggu: 0,
      disetujui: 0,
      diantar: 0,
      selesai: 0,
      ditolak: 0,
      total: permintaan.length,
    };
    for (const p of permintaan) {
      const info = getStatusInfo(p);
      if (info.key === "MENUNGGU") s.menunggu += 1;
      else if (info.key === "DISETUJUI") s.disetujui += 1;
      else if (info.key === "DIANTAR") s.diantar += 1;
      else if (info.key === "SELESAI") s.selesai += 1;
      else if (info.key === "DITOLAK") s.ditolak += 1;
      // Dibatalkan tidak dimasukkan strip supaya visual tidak terlalu ramai
    }
    return s;
  }, [permintaan]);

  // Derived: list setelah difilter + sort terbaru di atas
  const filtered = useMemo(() => {
    let list = [...permintaan];

    if (filterStatus) {
      list = list.filter((p) => getStatusInfo(p).key === filterStatus);
    }
    if (dari) {
      const from = new Date(dari);
      from.setHours(0, 0, 0, 0);
      list = list.filter((p) => new Date(p.createdAt) >= from);
    }
    if (sampai) {
      const to = new Date(sampai);
      to.setHours(23, 59, 59, 999);
      list = list.filter((p) => new Date(p.createdAt) <= to);
    }

    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }, [permintaan, filterStatus, dari, sampai]);

  const detailPermintaan = detailId
    ? permintaan.find((p) => p.id === detailId)
    : null;
  const cancelPermintaan = cancelConfirmId
    ? permintaan.find((p) => p.id === cancelConfirmId)
    : null;

  const canBatalkan = (p) => {
    if (!p) return false;
    if (["SELESAI", "DITOLAK_ADMIN"].includes(p.statusAdmin)) return false;
    const tugas = p.tugasPetugas?.[0];
    if (!tugas) return true;
    if (tugas.petugasId) return false;
    if (
      ["ON_DELIVERY", "DALAM_PROSES", "SELESAI", "DELIVERED"].includes(
        tugas.statusTugas
      )
    )
      return false;
    return true;
  };

  const handleBatalkan = async () => {
    if (!cancelPermintaan) return;
    setCancelLoading(true);
    try {
      const res = await fetch(
        apiUrl(`/api/permintaan/${cancelPermintaan.id}/batal`),
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || "Gagal membatalkan permintaan", "error");
        return;
      }
      showToast("Permintaan berhasil dibatalkan", "success");
      await fetchPermintaan();
      if (detailId === cancelPermintaan.id) setDetailId(null);
      setCancelConfirmId(null);
    } catch {
      showToast("Koneksi gagal saat membatalkan.", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  const resetFilter = () => {
    setFilterStatus("");
    setDari("");
    setSampai("");
  };

  const hasActiveFilter = Boolean(filterStatus || dari || sampai);

  // ========================= RENDER =========================

  return (
    <main className="app-content">
      <h1>Permintaan Saya</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Riwayat permintaan ATK kamu. Buat permintaan baru dari menu{" "}
        <strong>Minta Barang</strong>.
      </p>

      {/* ============ SUMMARY STRIP ============ */}
      {!loading && permintaan.length > 0 && (
        <div className="summary-strip">
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-warning" />
            <span className="summary-strip-label">Menunggu</span>
            <span className="summary-strip-value">{stats.menunggu}</span>
          </span>
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-success" />
            <span className="summary-strip-label">Disetujui</span>
            <span className="summary-strip-value">{stats.disetujui}</span>
          </span>
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-info" />
            <span className="summary-strip-label">Diantar</span>
            <span className="summary-strip-value">{stats.diantar}</span>
          </span>
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-success" />
            <span className="summary-strip-label">Sudah sampai</span>
            <span className="summary-strip-value">{stats.selesai}</span>
          </span>
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-danger" />
            <span className="summary-strip-label">Ditolak</span>
            <span className="summary-strip-value">{stats.ditolak}</span>
          </span>
          <span className="summary-strip-sep" />
          <span className="summary-strip-item">
            <span className="summary-strip-label">Total</span>
            <span className="summary-strip-value">{stats.total}</span>
          </span>
        </div>
      )}

      {/* ============ FILTER BAR ============ */}
      {!loading && permintaan.length > 0 && (
        <div className="log-filter-bar">
          <div className="log-filter-item">
            <span className="log-filter-label">Status</span>
            <select
              className="log-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Semua</option>
              <option value="MENUNGGU">Menunggu</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DIANTAR">Diantar</option>
              <option value="SELESAI">Sudah sampai</option>
              <option value="DITOLAK">Ditolak</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </div>

          <div className="log-filter-item">
            <span className="log-filter-label">Periode</span>
            <div className="filter-row" title="Filter periode">
              <i className="fa-regular fa-calendar" />
              <input
                type="date"
                value={dari}
                onChange={(e) => setDari(e.target.value)}
                aria-label="Dari"
              />
              <span>—</span>
              <input
                type="date"
                value={sampai}
                onChange={(e) => setSampai(e.target.value)}
                aria-label="Sampai"
              />
              {(dari || sampai) && (
                <button
                  type="button"
                  className="filter-row-clear"
                  onClick={() => {
                    setDari("");
                    setSampai("");
                  }}
                  title="Bersihkan periode"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              className="btn-link-danger"
              onClick={resetFilter}
            >
              <i className="fa-solid fa-rotate-left" /> Reset filter
            </button>
          )}
        </div>
      )}

      {error && <p className="app-error">{error}</p>}

      {/* ============ TABLE / EMPTY STATE ============ */}
      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : permintaan.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-clipboard-list" />
          <div className="empty-state-title">Belum ada permintaan</div>
          <p className="empty-state-sub">
            Buat permintaan dari menu <strong>Minta Barang</strong> di sidebar.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-magnifying-glass" />
          <div className="empty-state-title">Tidak ada hasil</div>
          <p className="empty-state-sub">
            Coba ubah filter atau reset untuk melihat semua permintaan.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>Tanggal</th>
                <th style={{ width: 160 }}>Status</th>
                <th>Item</th>
                <th style={{ width: 220 }}>Petugas pengantar</th>
                <th style={{ width: 120, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const info = getStatusInfo(p);
                const items = p.items || [];
                const totalQty = items.reduce(
                  (sum, it) => sum + (it.jumlah || 0),
                  0
                );
                const itemTooltip = items
                  .map(
                    (it) =>
                      `${it.barang?.nama ?? "-"} × ${it.jumlah} ${
                        it.barang?.satuan ?? ""
                      }`
                  )
                  .join("\n");
                const petugas = p.tugasPetugas?.[0]?.petugas;

                return (
                  <tr key={p.id}>
                    <td>{toIdDate(p.createdAt)}</td>
                    <td>
                      <span className={`pill pill-${info.variant}`}>
                        {info.label}
                      </span>
                    </td>
                    <td>
                      {items.length === 0 ? (
                        <span className="app-muted">—</span>
                      ) : items.length === 1 ? (
                        <span title={itemTooltip}>
                          {items[0].barang?.nama} × {items[0].jumlah}{" "}
                          {items[0].barang?.satuan}
                        </span>
                      ) : (
                        <span
                          className="pill pill-muted"
                          title={itemTooltip}
                          style={{ cursor: "help" }}
                        >
                          {items.length} item · {totalQty} pcs
                        </span>
                      )}
                    </td>
                    <td>
                      {petugas ? (
                        <UserCell
                          nama={petugas.nama}
                          email={petugas.email}
                        />
                      ) : (
                        <span
                          className="app-muted"
                          style={{ fontStyle: "italic" }}
                        >
                          Belum ditugaskan
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Lihat detail"
                        onClick={() => setDetailId(p.id)}
                      >
                        <i className="fa-solid fa-eye" />
                      </button>
                      {canBatalkan(p) && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          title="Batalkan permintaan"
                          style={{ marginLeft: "0.35rem" }}
                          onClick={() => setCancelConfirmId(p.id)}
                        >
                          <i className="fa-solid fa-ban" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ MODAL DETAIL ============ */}
      {detailPermintaan && (
        <div className="modal-overlay" onClick={() => setDetailId(null)}>
          <div
            className="modal-box modal-box-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Detail Permintaan</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDetailId(null)}
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <p className="modal-subtitle">
              Dibuat{" "}
              <strong>{toIdDateTime(detailPermintaan.createdAt)}</strong>
            </p>
            <div className="modal-divider" />

            <div className="detail-meta-grid">
              <div>
                <span className="detail-meta-label">Status</span>
                <div>
                  <span
                    className={`pill pill-${
                      getStatusInfo(detailPermintaan).variant
                    }`}
                  >
                    {getStatusInfo(detailPermintaan).label}
                  </span>
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Petugas pengantar</span>
                <div>
                  {detailPermintaan.tugasPetugas?.[0]?.petugas ? (
                    <UserCell
                      nama={detailPermintaan.tugasPetugas[0].petugas.nama}
                      email={detailPermintaan.tugasPetugas[0].petugas.email}
                    />
                  ) : (
                    <span
                      className="app-muted"
                      style={{ fontStyle: "italic" }}
                    >
                      Belum ditugaskan
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Lokasi pengantaran</span>
                <div>
                  {detailPermintaan.tugasPetugas?.[0]?.lokasiTujuan || (
                    <span className="app-muted">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Jumlah jenis</span>
                <div>{detailPermintaan.items?.length || 0} jenis barang</div>
              </div>
            </div>

            <div className="detail-section-title">
              Daftar Item ({detailPermintaan.items?.length || 0})
            </div>
            {detailPermintaan.items?.length ? (
              <div className="detail-items-list">
                {detailPermintaan.items.map((it) => (
                  <div key={it.id} className="detail-item-row">
                    <span className="detail-item-name">
                      {it.barang?.nama || "—"}{" "}
                      <small>({it.barang?.satuan || "-"})</small>
                    </span>
                    <span className="detail-item-qty">{it.jumlah}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="app-muted"
                style={{ fontSize: "0.85rem", marginBottom: "0.85rem" }}
              >
                Tidak ada item.
              </p>
            )}

            {detailPermintaan.catatanAdmin && (
              <>
                <div className="detail-section-title">Catatan admin</div>
                <div
                  className="detail-meta-grid"
                  style={{ gridTemplateColumns: "1fr" }}
                >
                  <div className="detail-meta-value">
                    {detailPermintaan.catatanAdmin}
                  </div>
                </div>
              </>
            )}

            <div className="modal-actions-block">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDetailId(null)}
              >
                Tutup
              </button>
              {canBatalkan(detailPermintaan) && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    setDetailId(null);
                    setCancelConfirmId(detailPermintaan.id);
                  }}
                >
                  <i className="fa-solid fa-ban" /> Batalkan Permintaan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL KONFIRMASI BATALKAN ============ */}
      {cancelPermintaan && (
        <div
          className="modal-overlay"
          onClick={() => !cancelLoading && setCancelConfirmId(null)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Batalkan Permintaan?</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setCancelConfirmId(null)}
                disabled={cancelLoading}
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-divider" />
            <p>
              Permintaan tanggal{" "}
              <strong>{toIdDate(cancelPermintaan.createdAt)}</strong> akan
              dibatalkan dan tidak bisa dikembalikan.
            </p>
            <p className="app-muted">
              {cancelPermintaan.items?.length || 0} item akan dihapus dari
              antrian pengambilan.
            </p>
            <div className="modal-actions-block">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCancelConfirmId(null)}
                disabled={cancelLoading}
              >
                Kembali
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleBatalkan}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Membatalkan..." : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TOAST ============ */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast toast-${toast.variant}`}>
            <span className="toast-icon">
              <i
                className={`fa-solid ${
                  toast.variant === "success"
                    ? "fa-check"
                    : toast.variant === "error"
                    ? "fa-xmark"
                    : "fa-info"
                }`}
              />
            </span>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setToast(null)}
              title="Tutup"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
