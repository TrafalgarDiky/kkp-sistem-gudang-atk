"use client";

/**
 * Daftar Tugas — Petugas (Opsi B: Moderate refactor).
 *
 * Fitur modern:
 * - Summary strip compact (Tersedia, Tugas Saya, Total aktif).
 * - Filter bar (Kepemilikan: Semua/Tugas Saya/Tersedia, Status: Semua/Menunggu/Diantar).
 * - Tabel: Tanggal, Peminta (UserCell + divisi), Item (pill kalau >1),
 *   Status (pill), Petugas, Aksi (icon + tombol kontekstual).
 * - Modal Detail lebar (modal-header + modal-subtitle + detail-meta-grid).
 * - Modal input Lokasi Tujuan (ganti window.prompt kuno).
 * - Modal konfirmasi "Lepas Tugas".
 * - Toast notifikasi (sukses/gagal).
 *
 * Endpoint:
 * - GET   /api/permintaan/tugas                  -> list tugas
 * - PATCH /api/permintaan/tugas/:id/ambil        -> ambil tugas
 * - PATCH /api/permintaan/tugas/:id/lepas        -> lepas tugas
 * - PATCH /api/permintaan/tugas/:id              -> update status + lokasi
 * - GET   /api/permintaan/:id                    -> detail + daftar item
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiUrl, getAuthHeaders, resolveBarangImageSrc } from "@/lib/api";
import { UserCell } from "@/components/ui";

/**
 * Set nilai ownership yang diterima dari URL (?kepemilikan=...).
 * Selalu uppercase supaya tidak case-sensitive.
 */
const VALID_OWNERSHIP = new Set(["SAYA", "TERSEDIA"]);

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
 * Map status tugas + status permintaan → { label, variant, key }.
 *
 * Urutan prioritas:
 *   1. Kalau permintaan sudah DITOLAK_ADMIN → override jadi "Ditolak".
 *   2. Lainnya tergantung statusTugas.
 *
 * Kenapa ada key?
 *   - Untuk filter dropdown, kita pakai key (bukan statusTugas mentah) supaya
 *     dua status legacy (DALAM_PROSES & ON_DELIVERY) bisa disamakan jadi
 *     "DIANTAR".
 */
function getStatusInfo(t) {
  if (t?.permintaan?.statusAdmin === "DITOLAK_ADMIN") {
    return { label: "Ditolak", variant: "danger", key: "DITOLAK" };
  }
  const s = t?.statusTugas;
  if (s === "MENUNGGU_ASSIGN")
    return { label: "Menunggu", variant: "warning", key: "MENUNGGU" };
  if (s === "DALAM_PROSES" || s === "ON_DELIVERY")
    return { label: "Diantar", variant: "info", key: "DIANTAR" };
  if (s === "SELESAI" || s === "DELIVERED")
    return { label: "Selesai", variant: "success", key: "SELESAI" };
  if (s === "DITOLAK")
    return { label: "Ditolak", variant: "danger", key: "DITOLAK" };
  return { label: s || "—", variant: "muted", key: "OTHER" };
}

// ========================= Component =========================

export default function PetugasTugas() {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [filterOwnership, setFilterOwnership] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const searchParams = useSearchParams();

  /**
   * Baca ?kepemilikan=SAYA|TERSEDIA saat halaman dibuka (mis. dari Dashboard
   * Petugas klik stat card). Hanya nilai yang ada di VALID_OWNERSHIP diterima.
   */
  useEffect(() => {
    const fromUrl = (searchParams.get("kepemilikan") || "").toUpperCase();
    if (VALID_OWNERSHIP.has(fromUrl)) {
      setFilterOwnership(fromUrl);
    }
  }, [searchParams]);

  const [detailId, setDetailId] = useState(null);
  const [confirmLepasId, setConfirmLepasId] = useState(null);
  const [lokasiModal, setLokasiModal] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

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

  /* ---------- Fetch list tugas ---------- */
  const fetchTugas = async () => {
    setError("");
    try {
      const res = await fetch(apiUrl("/api/permintaan/tugas"), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setTugas(data.data?.tugas || []);
      else setError(data.message || "Gagal memuat tugas");
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTugas();
  }, []);

  /* ---------- Derived: list yang AKTIF saja ---------- */
  const tugasAktif = useMemo(
    () =>
      tugas.filter(
        (t) =>
          t.permintaan?.statusAdmin !== "DITOLAK_ADMIN" &&
          t.statusTugas !== "DITOLAK" &&
          t.statusTugas !== "SELESAI" &&
          t.statusTugas !== "DELIVERED"
      ),
    [tugas]
  );

  /* ---------- Derived: summary strip stats ---------- */
  const stats = useMemo(() => {
    let tersedia = 0;
    let saya = 0;
    const total = tugasAktif.length;

    for (const t of tugasAktif) {
      if (t.statusTugas === "MENUNGGU_ASSIGN" && !t.petugasId) tersedia += 1;
      if (t.petugasId && t.petugasId === currentUserId) saya += 1;
    }
    return { tersedia, saya, total };
  }, [tugasAktif, currentUserId]);

  /* ---------- Derived: list setelah filter ---------- */
  const filtered = useMemo(() => {
    let list = [...tugasAktif];

    if (filterOwnership === "SAYA") {
      list = list.filter(
        (t) => t.petugasId && t.petugasId === currentUserId
      );
    } else if (filterOwnership === "TERSEDIA") {
      list = list.filter(
        (t) => t.statusTugas === "MENUNGGU_ASSIGN" && !t.petugasId
      );
    }

    if (filterStatus) {
      list = list.filter((t) => getStatusInfo(t).key === filterStatus);
    }

    list.sort(
      (a, b) =>
        new Date(b.permintaan?.createdAt || 0).getTime() -
        new Date(a.permintaan?.createdAt || 0).getTime()
    );
    return list;
  }, [tugasAktif, filterOwnership, filterStatus, currentUserId]);

  const detailTugas = detailId ? tugas.find((t) => t.id === detailId) : null;
  const lepasTugas = confirmLepasId
    ? tugas.find((t) => t.id === confirmLepasId)
    : null;

  const hasActiveFilter = Boolean(filterOwnership || filterStatus);
  const resetFilter = () => {
    setFilterOwnership("");
    setFilterStatus("");
  };

  /* ========================= Handlers ========================= */

  const handleAmbil = async (tugasId) => {
    setUpdatingId(tugasId);
    try {
      const res = await fetch(
        apiUrl(`/api/permintaan/tugas/${tugasId}/ambil`),
        { method: "PATCH", headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || "Gagal mengambil tugas", "error");
        return;
      }
      showToast("Tugas berhasil diambil", "success");
      await fetchTugas();
    } catch {
      showToast("Koneksi gagal.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLepas = async () => {
    if (!lepasTugas) return;
    setUpdatingId(lepasTugas.id);
    try {
      const res = await fetch(
        apiUrl(`/api/permintaan/tugas/${lepasTugas.id}/lepas`),
        { method: "PATCH", headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || "Gagal melepas tugas", "error");
        return;
      }
      showToast("Tugas dilepas, kembali ke antrian", "success");
      if (detailId === lepasTugas.id) setDetailId(null);
      setConfirmLepasId(null);
      await fetchTugas();
    } catch {
      showToast("Koneksi gagal.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  /* Buka modal input lokasi → nanti submit lewat handleSubmitLokasi. */
  const openLokasiModal = (tugasId) => {
    setLokasiModal({
      tugasId,
      lokasi: "",
      submitting: false,
      error: "",
    });
  };

  const handleSubmitLokasi = async (e) => {
    e.preventDefault();
    if (!lokasiModal) return;
    const lokasi = lokasiModal.lokasi.trim();
    if (!lokasi) {
      setLokasiModal((prev) => ({
        ...prev,
        error: "Lokasi tujuan wajib diisi.",
      }));
      return;
    }

    setLokasiModal((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const res = await fetch(
        apiUrl(`/api/permintaan/tugas/${lokasiModal.tugasId}`),
        {
          method: "PATCH",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ statusTugas: "SELESAI", lokasiTujuan: lokasi }),
        }
      );
      const data = await res.json();
      if (!data.success) {
        setLokasiModal((prev) => ({
          ...prev,
          submitting: false,
          error: data.message || "Gagal menyelesaikan tugas",
        }));
        return;
      }
      showToast("Tugas selesai. Terima kasih!", "success");
      if (detailId === lokasiModal.tugasId) setDetailId(null);
      setLokasiModal(null);
      await fetchTugas();
    } catch {
      setLokasiModal((prev) => ({
        ...prev,
        submitting: false,
        error: "Koneksi gagal.",
      }));
    }
  };

  /* Detail: buka lokal dulu, lalu fetch detail /api/permintaan/:id utk items+foto. */
  const handleOpenDetail = async (t) => {
    setDetailId(t.id);
    try {
      const res = await fetch(apiUrl(`/api/permintaan/${t.permintaanId}`), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success || !data.data?.permintaan) return;
      setTugas((prev) =>
        prev.map((row) =>
          row.id === t.id
            ? {
                ...row,
                permintaan: { ...row.permintaan, ...data.data.permintaan },
              }
            : row
        )
      );
    } catch {
      /* fallback: pakai data list */
    }
  };

  /* ========================= RENDER ========================= */

  return (
    <main className="app-content">
      <h1>Daftar Tugas</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Daftar permintaan yang perlu kamu antar. Klik <strong>Ambil</strong>{" "}
        untuk menerima tugas, lalu <strong>Selesai</strong> saat barang sudah
        sampai di lokasi.
      </p>

      {/* ============ SUMMARY STRIP ============ */}
      {!loading && tugasAktif.length > 0 && (
        <div className="summary-strip">
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-warning" />
            <span className="summary-strip-label">Tersedia</span>
            <span className="summary-strip-value">{stats.tersedia}</span>
          </span>
          <span className="summary-strip-item">
            <span className="summary-strip-dot is-info" />
            <span className="summary-strip-label">Tugas Saya</span>
            <span className="summary-strip-value">{stats.saya}</span>
          </span>
          <span className="summary-strip-sep" />
          <span className="summary-strip-item">
            <span className="summary-strip-label">Total Aktif</span>
            <span className="summary-strip-value">{stats.total}</span>
          </span>
        </div>
      )}

      {/* ============ FILTER BAR ============ */}
      {!loading && tugasAktif.length > 0 && (
        <div className="log-filter-bar">
          <div className="log-filter-item">
            <span className="log-filter-label">Kepemilikan</span>
            <select
              className="log-filter-select"
              value={filterOwnership}
              onChange={(e) => setFilterOwnership(e.target.value)}
            >
              <option value="">Semua tugas</option>
              <option value="SAYA">Tugas saya</option>
              <option value="TERSEDIA">Tersedia</option>
            </select>
          </div>

          <div className="log-filter-item">
            <span className="log-filter-label">Status</span>
            <select
              className="log-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Semua</option>
              <option value="MENUNGGU">Menunggu</option>
              <option value="DIANTAR">Diantar</option>
            </select>
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
      ) : tugasAktif.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-truck" />
          <div className="empty-state-title">Tidak ada tugas aktif</div>
          <p className="empty-state-sub">
            Semua tugas sudah selesai. Cek{" "}
            <a href="/permintaan/riwayat" style={{ color: "var(--primary)" }}>
              Riwayat Tugas
            </a>{" "}
            untuk pengantaran yang sudah lalu.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-magnifying-glass" />
          <div className="empty-state-title">Tidak ada hasil</div>
          <p className="empty-state-sub">
            Ubah filter atau reset untuk melihat semua tugas.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>Tanggal</th>
                <th style={{ width: 112 }}>Kode</th>
                <th style={{ width: 220 }}>Peminta</th>
                <th>Item</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 200 }}>Petugas</th>
                <th style={{ width: 220, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const info = getStatusInfo(t);
                const items = t.permintaan?.items || [];
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

                const isTakenByMe =
                  t.petugasId && t.petugasId === currentUserId;
                const isTakenByOther =
                  t.petugasId && t.petugasId !== currentUserId;
                const canAmbil =
                  !t.petugasId && t.statusTugas === "MENUNGGU_ASSIGN";
                const canSelesai =
                  isTakenByMe &&
                  ["MENUNGGU_ASSIGN", "DALAM_PROSES", "ON_DELIVERY"].includes(
                    t.statusTugas
                  );
                const peminta = t.permintaan?.peminta;

                return (
                  <tr
                    key={t.id}
                    style={{
                      opacity: isTakenByOther ? 0.75 : 1,
                    }}
                  >
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
                      <span className={`pill pill-${info.variant}`}>
                        {info.label}
                      </span>
                    </td>
                    <td>
                      {t.petugas ? (
                        <div>
                          <UserCell name={t.petugas.nama} />
                          {isTakenByMe && (
                            <div
                              style={{
                                marginLeft: "2.3rem",
                                marginTop: "0.1rem",
                                fontSize: "0.75rem",
                                color: "var(--primary)",
                                fontWeight: 600,
                              }}
                            >
                              (Saya)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className="app-muted"
                          style={{ fontStyle: "italic" }}
                        >
                          Belum ada petugas
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {canAmbil && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{
                            padding: "0.35rem 0.85rem",
                            fontSize: "0.82rem",
                            marginRight: "0.35rem",
                          }}
                          disabled={updatingId === t.id}
                          onClick={() => handleAmbil(t.id)}
                        >
                          {updatingId === t.id ? "..." : "Ambil"}
                        </button>
                      )}
                      {canSelesai && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{
                            padding: "0.35rem 0.85rem",
                            fontSize: "0.82rem",
                            marginRight: "0.35rem",
                          }}
                          onClick={() => openLokasiModal(t.id)}
                        >
                          <i className="fa-solid fa-check" /> Selesai
                        </button>
                      )}
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
      )}

      {/* ============ MODAL DETAIL ============ */}
      {detailTugas && (
        <div className="modal-overlay" onClick={() => setDetailId(null)}>
          <div
            className="modal-box modal-box-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Detail Tugas</h2>
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
              Permintaan{" "}
              <strong>{toIdDateTime(detailTugas.permintaan?.createdAt)}</strong>
            </p>
            <div className="modal-divider" />

            <div className="detail-meta-grid">
              <div>
                <span className="detail-meta-label">Kode permintaan</span>
                <div style={{ fontFamily: "ui-monospace, monospace" }}>
                  {detailTugas.permintaan?.kode ?? "—"}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Status tugas</span>
                <div>
                  <span
                    className={`pill pill-${getStatusInfo(detailTugas).variant}`}
                  >
                    {getStatusInfo(detailTugas).label}
                  </span>
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Peminta</span>
                <div>
                  {detailTugas.permintaan?.peminta ? (
                    <UserCell name={detailTugas.permintaan.peminta.nama} />
                  ) : (
                    <span className="app-muted">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Divisi</span>
                <div>
                  {detailTugas.permintaan?.peminta?.divisi || (
                    <span className="app-muted">—</span>
                  )}
                </div>
              </div>
              <div>
                <span className="detail-meta-label">Petugas</span>
                <div>
                  {detailTugas.petugas ? (
                    <UserCell name={detailTugas.petugas.nama} />
                  ) : (
                    <span
                      className="app-muted"
                      style={{ fontStyle: "italic" }}
                    >
                      Belum ada petugas
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="detail-section-title">
              Daftar Barang ({detailTugas.permintaan?.items?.length || 0})
            </div>
            {detailTugas.permintaan?.items?.length ? (
              <div
                style={{
                  display: "grid",
                  gap: "0.55rem",
                  marginBottom: "1rem",
                }}
              >
                {detailTugas.permintaan.items.map((it) => (
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

            {detailTugas.permintaan?.catatanAdmin && (
              <>
                <div className="detail-section-title">Catatan</div>
                <div
                  className="detail-meta-grid"
                  style={{ gridTemplateColumns: "1fr" }}
                >
                  <div className="detail-meta-value">
                    {detailTugas.permintaan.catatanAdmin}
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
              {detailTugas.petugasId === currentUserId &&
                ["MENUNGGU_ASSIGN", "DALAM_PROSES", "ON_DELIVERY"].includes(
                  detailTugas.statusTugas
                ) &&
                detailTugas.permintaan?.statusAdmin !== "DITOLAK_ADMIN" && (
                  <>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setConfirmLepasId(detailTugas.id)}
                    >
                      <i className="fa-solid fa-rotate-left" /> Lepas Tugas
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => openLokasiModal(detailTugas.id)}
                    >
                      <i className="fa-solid fa-check" /> Selesai
                    </button>
                  </>
                )}
              {!detailTugas.petugasId &&
                detailTugas.statusTugas === "MENUNGGU_ASSIGN" &&
                detailTugas.permintaan?.statusAdmin !== "DITOLAK_ADMIN" && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={updatingId === detailTugas.id}
                    onClick={() => handleAmbil(detailTugas.id)}
                  >
                    {updatingId === detailTugas.id
                      ? "..."
                      : "Ambil Tugas"}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL KONFIRMASI LEPAS ============ */}
      {lepasTugas && (
        <div
          className="modal-overlay"
          onClick={() => updatingId !== lepasTugas.id && setConfirmLepasId(null)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lepas Tugas?</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setConfirmLepasId(null)}
                disabled={updatingId === lepasTugas.id}
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-divider" />
            <p>
              Tugas akan dikembalikan ke antrian dan petugas lain bisa
              mengambilnya.
            </p>
            <p className="app-muted">
              Tanggal permintaan:{" "}
              <strong>{toIdDate(lepasTugas.permintaan?.createdAt)}</strong>
            </p>
            <div className="modal-actions-block">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmLepasId(null)}
                disabled={updatingId === lepasTugas.id}
              >
                Kembali
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleLepas}
                disabled={updatingId === lepasTugas.id}
              >
                {updatingId === lepasTugas.id ? "Melepas..." : "Ya, Lepas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL INPUT LOKASI ============ */}
      {lokasiModal && (
        <div
          className="modal-overlay"
          onClick={() => !lokasiModal.submitting && setLokasiModal(null)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Konfirmasi Selesai</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setLokasiModal(null)}
                disabled={lokasiModal.submitting}
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <p className="modal-subtitle">
              Isi lokasi tempat barang diserahkan. Informasi ini akan tampil di
              Riwayat Tugas.
            </p>
            <div className="modal-divider" />

            <form onSubmit={handleSubmitLokasi}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.35rem",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                Lokasi tujuan
              </label>
              <input
                type="text"
                value={lokasiModal.lokasi}
                onChange={(e) =>
                  setLokasiModal((prev) => ({
                    ...prev,
                    lokasi: e.target.value,
                    error: "",
                  }))
                }
                placeholder="Contoh: Ruang TU · Lantai 2 · Bagian Keuangan"
                autoFocus
                disabled={lokasiModal.submitting}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.6rem 0.85rem",
                  fontSize: "0.92rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  outline: "none",
                }}
              />
              {lokasiModal.error && (
                <p
                  className="form-error"
                  style={{ marginTop: "0.5rem", marginBottom: 0 }}
                >
                  {lokasiModal.error}
                </p>
              )}

              <div className="modal-actions-block">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setLokasiModal(null)}
                  disabled={lokasiModal.submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={lokasiModal.submitting}
                >
                  {lokasiModal.submitting ? "Menyimpan..." : "Selesaikan Tugas"}
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
