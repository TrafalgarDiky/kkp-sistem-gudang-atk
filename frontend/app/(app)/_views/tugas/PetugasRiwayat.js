"use client";

/**
 * Riwayat Tugas — Petugas (Opsi B: Moderate refactor).
 *
 * Fitur modern:
 * - Privasi: hanya tampilkan tugas dengan petugasId = user saat ini.
 * - Summary strip compact (Hari Ini, Minggu Ini, Bulan Ini, Total).
 * - Filter periode (Dari–Sampai) + reset.
 * - Tabel: Tanggal Antar, Peminta (UserCell + divisi), Item (pill kalau >1),
 *   Lokasi, Aksi (icon Detail).
 * - Modal Detail: daftar barang + foto + catatan admin.
 * - Empty state modern.
 * - Pagination 10 per halaman (konsisten dengan halaman lain).
 *
 * Endpoint:
 * - GET /api/permintaan/tugas        -> list tugas (lalu difilter client-side)
 * - GET /api/permintaan/:id          -> detail lengkap (foto + catatan)
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiUrl, getAuthHeaders, resolveBarangImageSrc } from "@/lib/api";
import { UserCell } from "@/components/ui";

const PER_PAGE_OPTIONS = [10, 25, 50];

// ========================= Helpers =========================

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
 * Periode untuk summary strip:
 * - today  : tanggal hari ini (00:00 s.d. 23:59)
 * - week   : Senin–Minggu minggu ini (kalender)
 * - month  : bulan kalender berjalan
 *
 * Kenapa kalender (bukan rolling 7/30 hari)?
 *   Lebih familiar buat user ("bulan ini = April", bukan "30 hari terakhir").
 */
function getPeriodRanges() {
  const now = new Date();

  const today = {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
  };

  const dow = now.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const week = { start: monday, end: sunday };

  const month = {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };

  return { today, week, month };
}

function isInRange(dateValue, range) {
  if (!dateValue || !range) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  return d >= range.start && d <= range.end;
}

// ========================= Component =========================

export default function PetugasRiwayat() {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const [detailId, setDetailId] = useState(null);
  const [detailFull, setDetailFull] = useState(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  /* ---------- Ambil user id dari localStorage ---------- */
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUserId(u?.id ?? null);
      }
    } catch {
      /* diam */
    }
  }, []);

  /* ---------- Fetch list tugas (sekali saja) ---------- */
  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(apiUrl("/api/permintaan/tugas"), { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTugas(data.data?.tugas || []);
        else setError(data.message || "Gagal memuat riwayat");
      })
      .catch(() => setError("Koneksi gagal."))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Riwayat = tugas SELESAI/DELIVERED milik petugas saat ini.
   *
   * PENTING: filter pakai currentUserId supaya petugas hanya lihat
   * pengantaran miliknya sendiri (privasi).
   */
  const riwayat = useMemo(() => {
    if (!currentUserId) return [];
    return tugas
      .filter(
        (t) =>
          t.petugasId === currentUserId &&
          (t.statusTugas === "SELESAI" || t.statusTugas === "DELIVERED")
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
  }, [tugas, currentUserId]);

  /* ---------- Summary strip stats (periode kalender) ---------- */
  const stats = useMemo(() => {
    const ranges = getPeriodRanges();
    let hariIni = 0;
    let mingguIni = 0;
    let bulanIni = 0;
    for (const t of riwayat) {
      const d = t.updatedAt || t.createdAt;
      if (isInRange(d, ranges.today)) hariIni += 1;
      if (isInRange(d, ranges.week)) mingguIni += 1;
      if (isInRange(d, ranges.month)) bulanIni += 1;
    }
    return { hariIni, mingguIni, bulanIni, total: riwayat.length };
  }, [riwayat]);

  /* ---------- Apply filter periode user (dari–sampai) ---------- */
  const filtered = useMemo(() => {
    let list = [...riwayat];
    if (dari) {
      const from = new Date(dari);
      from.setHours(0, 0, 0, 0);
      list = list.filter(
        (t) => new Date(t.updatedAt || t.createdAt) >= from
      );
    }
    if (sampai) {
      const to = new Date(sampai);
      to.setHours(23, 59, 59, 999);
      list = list.filter(
        (t) => new Date(t.updatedAt || t.createdAt) <= to
      );
    }
    return list;
  }, [riwayat, dari, sampai]);

  /* ---------- Pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const visible = filtered.slice(startIdx, startIdx + perPage);

  /* Reset halaman ke 1 kalau filter berubah. */
  useEffect(() => {
    setPage(1);
  }, [dari, sampai, perPage]);

  const hasActiveFilter = Boolean(dari || sampai);
  const resetFilter = () => {
    setDari("");
    setSampai("");
  };

  const detailTugas = detailId ? riwayat.find((t) => t.id === detailId) : null;

  /* ---------- Buka detail: fetch data lengkap (foto + catatan) ---------- */
  const handleOpenDetail = async (t) => {
    setDetailId(t.id);
    setDetailFull(null);
    try {
      const res = await fetch(apiUrl(`/api/permintaan/${t.permintaanId}`), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data?.permintaan) {
        setDetailFull(data.data.permintaan);
      }
    } catch {
      /* fallback: pakai data ringkas dari list */
    }
  };

  /* ========================= RENDER ========================= */

  const displayedPermintaan =
    detailFull || detailTugas?.permintaan || null;

  return (
    <main className="app-content">
      <h1>Riwayat Tugas</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Daftar pengantaran yang sudah kamu selesaikan. Untuk tugas yang masih
        aktif, buka{" "}
        <Link href="/permintaan/tugas" style={{ color: "var(--primary)" }}>
          Daftar Tugas
        </Link>
        .
      </p>

      {/* ============ SUMMARY STRIP ============ */}
      {!loading && riwayat.length > 0 && (
        <div className="summary-strip">
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-success" />
            <span className="summary-strip-label">Hari Ini</span>
            <span className="summary-strip-value">{stats.hariIni}</span>
          </span>
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-info" />
            <span className="summary-strip-label">Minggu Ini</span>
            <span className="summary-strip-value">{stats.mingguIni}</span>
          </span>
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-warning" />
            <span className="summary-strip-label">Bulan Ini</span>
            <span className="summary-strip-value">{stats.bulanIni}</span>
          </span>
          <span className="summary-strip-sep" />
          <span className="summary-strip-item">
            <span className="summary-strip-label">Total</span>
            <span className="summary-strip-value">{stats.total}</span>
          </span>
        </div>
      )}

      {/* ============ FILTER BAR ============ */}
      {!loading && riwayat.length > 0 && (
        <div className="log-filter-bar">
          <div className="log-filter-item">
            <span className="log-filter-label">Periode</span>
            <div className="filter-row" title="Filter periode pengantaran">
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
                  onClick={resetFilter}
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
      ) : riwayat.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-clock-rotate-left" />
          <div className="empty-state-title">Belum ada riwayat</div>
          <p className="empty-state-sub">
            Pengantaran yang sudah kamu selesaikan akan muncul di sini.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-magnifying-glass" />
          <div className="empty-state-title">Tidak ada hasil</div>
          <p className="empty-state-sub">
            Coba ubah rentang tanggal atau reset filter.
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 150 }}>Tanggal Antar</th>
                  <th style={{ width: 112 }}>Kode</th>
                  <th style={{ width: 220 }}>Peminta</th>
                  <th>Item</th>
                  <th style={{ width: 200 }}>Lokasi</th>
                  <th style={{ width: 80, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const items = t.permintaan?.items || [];
                  const totalQty = items.reduce(
                    (s, it) => s + (it.jumlah || 0),
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
                  const peminta = t.permintaan?.peminta;

                  return (
                    <tr key={t.id}>
                      <td>{toIdDateTime(t.updatedAt || t.createdAt)}</td>
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
                        {peminta ? (
                          <div>
                            <UserCell name={peminta.nama} />
                            {peminta.divisi && (
                              <div
                                className="app-muted"
                                style={{
                                  marginLeft: "2.3rem",
                                  marginTop: "0.1rem",
                                  fontSize: "0.78rem",
                                }}
                              >
                                {peminta.divisi}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="app-muted">—</span>
                        )}
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
                        {t.lokasiTujuan ? (
                          t.lokasiTujuan
                        ) : (
                          <span className="app-muted">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="icon-btn"
                          title="Lihat detail"
                          onClick={() => handleOpenDetail(t)}
                        >
                          <i className="fa-solid fa-eye" />
                        </button>
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
              Menampilkan <strong>{visible.length}</strong> dari{" "}
              <strong>{filtered.length}</strong> entri
              {hasActiveFilter && ` (dari total ${riwayat.length})`}
            </div>
            <div className="pagination-controls">
              <label>
                Per halaman:&nbsp;
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                >
                  {PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                title="Sebelumnya"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <span>
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-icon"
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
                title="Berikutnya"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ MODAL DETAIL ============ */}
      {detailTugas && (
        <div
          className="modal-overlay"
          onClick={() => {
            setDetailId(null);
            setDetailFull(null);
          }}
        >
          <div
            className="modal-box modal-box-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Detail Pengantaran</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setDetailId(null);
                  setDetailFull(null);
                }}
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <p className="modal-subtitle">
              Diantar{" "}
              <strong>
                {toIdDateTime(
                  detailTugas.updatedAt || detailTugas.createdAt
                )}
              </strong>
            </p>
            <div className="modal-divider" />

            <div className="detail-meta-grid">
              <div>
                <span className="detail-meta-label">Kode permintaan</span>
                <div style={{ fontFamily: "ui-monospace, monospace" }}>
                  {displayedPermintaan?.kode ?? "—"}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Peminta</span>
                <div>
                  {displayedPermintaan?.peminta ? (
                    <UserCell name={displayedPermintaan.peminta.nama} />
                  ) : (
                    <span className="app-muted">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Divisi</span>
                <div>
                  {displayedPermintaan?.peminta?.divisi || (
                    <span className="app-muted">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Lokasi pengantaran</span>
                <div>
                  {detailTugas.lokasiTujuan || (
                    <span className="app-muted">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Jumlah jenis</span>
                <div>
                  {displayedPermintaan?.items?.length || 0} jenis barang
                </div>
              </div>
            </div>

            <div className="detail-section-title">
              Daftar Barang ({displayedPermintaan?.items?.length || 0})
            </div>
            {displayedPermintaan?.items?.length ? (
              <div
                style={{
                  display: "grid",
                  gap: "0.55rem",
                  marginBottom: "1rem",
                }}
              >
                {displayedPermintaan.items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: "flex",
                      gap: "0.65rem",
                      alignItems: "center",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "0.5rem",
                      background: "var(--surface-soft)",
                    }}
                  >
                    {it.barang?.gambarUrl ? (
                      <img
                        src={resolveBarangImageSrc(it.barang.gambarUrl)}
                        alt={it.barang?.nama || "Barang"}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "#fff",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          display: "grid",
                          placeItems: "center",
                          color: "var(--text-muted)",
                          background: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        <i className="fa-solid fa-image" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>
                        {it.barang?.nama || "—"}
                      </div>
                      <div
                        className="app-muted"
                        style={{ fontSize: "0.82rem" }}
                      >
                        {it.jumlah} {it.barang?.satuan}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="app-muted" style={{ fontSize: "0.85rem" }}>
                Tidak ada item.
              </p>
            )}

            {displayedPermintaan?.catatanAdmin && (
              <>
                <div className="detail-section-title">Catatan admin</div>
                <div
                  className="detail-meta-grid"
                  style={{ gridTemplateColumns: "1fr" }}
                >
                  <div className="detail-meta-value">
                    {displayedPermintaan.catatanAdmin}
                  </div>
                </div>
              </>
            )}

            <div className="modal-actions-block">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDetailId(null);
                  setDetailFull(null);
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
