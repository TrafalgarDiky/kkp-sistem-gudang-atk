"use client";

/** Barang — tampilan tabel + CRUD + upload gambar (Admin) */
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders, resolveBarangImageSrc } from "@/lib/api";
import { SATUAN_OPTIONS, normalizeSatuan } from "@/lib/satuan-options";

const initialForm = { kode: "", nama: "", satuan: "", stok: "", stokMinimum: "", deskripsi: "", gambarUrl: "" };

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

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

/**
 * Tentukan status stok berdasarkan jumlah & batas minimum.
 * Output: { variant, label, show } — show=false berarti normal, tidak perlu badge.
 */
function getStockStatus(stok, stokMin) {
  const s = Number(stok) || 0;
  if (s <= 0) return { variant: "empty", label: "Habis", show: true };
  if (stokMin != null && s < Number(stokMin)) {
    return { variant: "low", label: "Menipis", show: true };
  }
  return { variant: "ok", label: "OK", show: false };
}

/**
 * Samakan tampilan kode barang ke pola ATK-00078.
 * Catatan: ini format tampilan (display), bukan mengubah data mentah di DB.
 */
function formatBarangKode(kode) {
  const raw = String(kode || "").trim();
  if (!raw) return "—";

  const atk = /^ATK-(\d+)$/i.exec(raw);
  if (atk) return `ATK-${atk[1].padStart(5, "0")}`;

  const legacy = /^A-(\d+)$/i.exec(raw);
  if (legacy) return `ATK-${legacy[1].padStart(5, "0")}`;

  return raw.toUpperCase();
}

/**
 * Input kode dari UI (ATK-xxxxx / A-xxxx) -> format backend (A-xxxx).
 * Return null jika format tidak valid.
 */
function toApiBarangKode(input) {
  const raw = String(input || "").trim().toUpperCase();
  if (!raw) return null;

  const atk = /^ATK-(\d+)$/.exec(raw);
  if (atk) {
    const num = Number(atk[1]);
    if (!Number.isFinite(num)) return null;
    return `A-${String(num).padStart(4, "0")}`;
  }

  const legacy = /^A-(\d+)$/.exec(raw);
  if (legacy) {
    const num = Number(legacy[1]);
    if (!Number.isFinite(num)) return null;
    return `A-${String(num).padStart(4, "0")}`;
  }

  return null;
}

export default function AdminBarang() {
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Modal konfirmasi hapus (ganti window.confirm)
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, nama}
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Lightbox preview gambar
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Search & paginasi
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchBarang = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/barang"), {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) setBarang(data.data?.barang || []);
      else setError(data.message || "Gagal memuat barang");
    } catch (err) {
      setError("Koneksi gagal. Pastikan backend jalan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, []);

  /**
   * Filter barang berdasarkan kata kunci search.
   * Cari di: kode, nama, deskripsi (case-insensitive).
   */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return barang;
    return barang.filter((b) => {
      const kodeDisplay = formatBarangKode(b.kode).toLowerCase();
      return (
        (b.kode || "").toLowerCase().includes(q) ||
        kodeDisplay.includes(q) ||
        (b.nama || "").toLowerCase().includes(q) ||
        (b.deskripsi || "").toLowerCase().includes(q)
      );
    });
  }, [barang, search]);

  // Reset ke page 1 setiap kali search berubah
  useEffect(() => {
    setPage(1);
  }, [search, perPage]);

  // Slice untuk paginasi
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const visible = filtered.slice(startIdx, startIdx + perPage);

  const openTambah = () => {
    setEditingId(null);
    setForm(initialForm);
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditingId(b.id);
    setForm({
      kode: formatBarangKode(b.kode),
      nama: b.nama || "",
      satuan: normalizeSatuan(b.satuan),
      stok: String(b.stok ?? ""),
      stokMinimum: b.stokMinimum != null ? String(b.stokMinimum) : "",
      deskripsi: b.deskripsi || "",
      gambarUrl: b.gambarUrl || "",
    });
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitLoading) return; // jangan tutup saat sedang submit
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setImageFile(null);
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setModalError("");
  };

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setImageFile(null);
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setModalError("");
    try {
      let gambarUrl = form.gambarUrl.trim() || null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("gambar", imageFile);
        const upRes = await fetch(apiUrl("/api/upload"), {
          method: "POST",
          headers: getAuthHeaders(),
          body: fd,
        });
        const upData = await upRes.json();
        if (!upData.success) {
          setModalError(upData.message || "Gagal upload gambar");
          setSubmitLoading(false);
          return;
        }
        gambarUrl = upData.data?.url || null;
      }
      if (editingId) {
        const kodeApi = toApiBarangKode(form.kode);
        if (!kodeApi) {
          setModalError("Format kode barang harus seperti ATK-00078.");
          setSubmitLoading(false);
          return;
        }
      }

      const url = editingId
        ? apiUrl(`/api/barang/${editingId}`)
        : apiUrl("/api/barang");
      const method = editingId ? "PATCH" : "POST";
      const body = {
        ...(editingId ? { kode: toApiBarangKode(form.kode) } : {}),
        nama: form.nama.trim(),
        satuan: normalizeSatuan(form.satuan),
        stok: Number(form.stok) || 0,
        stokMinimum: form.stokMinimum === "" ? null : Number(form.stokMinimum) || null,
        deskripsi: form.deskripsi.trim() || null,
        gambarUrl,
      };
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        closeModal();
        fetchBarang();
      } else {
        const rawMsg = data.message || "Gagal menyimpan";
        // Pesan backend lama masih menyebut format A-0001; tampilkan versi UI terbaru.
        if (rawMsg.toLowerCase().includes("format kode barang harus seperti a-0001")) {
          setModalError("Format kode barang harus seperti ATK-00078.");
        } else {
          setModalError(rawMsg);
        }
      }
    } catch (err) {
      setModalError("Koneksi gagal");
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleteLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/barang/${deleteTarget.id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        fetchBarang();
      } else {
        setError(data.message || "Gagal menghapus");
      }
    } catch (err) {
      setError("Koneksi gagal");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = () => {
    const rows = [["Kode", "Nama", "Satuan", "Stok", "Stok Minimum", "Deskripsi", "Gambar URL"]];
    for (const b of barang) {
      rows.push([
        b.kode || "",
        b.nama || "",
        b.satuan || "",
        String(b.stok ?? ""),
        b.stokMinimum == null ? "" : String(b.stokMinimum),
        b.deskripsi || "",
        b.gambarUrl || "",
      ]);
    }
    downloadCsv(`stok_barang_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <main className="app-content">
      {/* ============ TOOLBAR: judul + search + aksi ============ */}
      <div className="list-toolbar">
        <h1>Stok Barang</h1>
        <div className="list-toolbar-spacer" />
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Cari kode, nama, deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-box-clear"
              onClick={() => setSearch("")}
              title="Bersihkan pencarian"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
        <div className="list-toolbar-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={handleExport}
            disabled={!barang.length}
            title="Export ke CSV"
          >
            <i className="fa-solid fa-download" />
            <span>Export</span>
          </button>
          <button type="button" className="btn-primary" onClick={openTambah}>
            <i className="fa-solid fa-plus" /> Tambah Barang
          </button>
        </div>
      </div>

      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : barang.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-box-open" />
          <div className="empty-state-title">Belum ada barang</div>
          <p className="empty-state-sub">Mulai dengan menambahkan barang pertama.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-magnifying-glass" />
          <div className="empty-state-title">Tidak ada hasil</div>
          <p className="empty-state-sub">Coba kata kunci lain atau bersihkan pencarian.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Foto</th>
                  <th style={{ width: 100 }}>Kode</th>
                  <th>Nama</th>
                  <th style={{ width: 90 }}>Satuan</th>
                  <th style={{ width: 130 }}>Stok</th>
                  <th>Deskripsi</th>
                  <th style={{ width: 110, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => {
                  const stat = getStockStatus(b.stok, b.stokMinimum);
                  const imgSrc = b.gambarUrl ? resolveBarangImageSrc(b.gambarUrl) : null;
                  return (
                    <tr key={b.id}>
                      <td>
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={b.nama}
                            className="thumb"
                            onClick={() => setLightboxUrl(imgSrc)}
                          />
                        ) : (
                          <span className="thumb-placeholder" title="Belum ada gambar">
                            <i className="fa-solid fa-image" />
                          </span>
                        )}
                      </td>
                      <td><code>{formatBarangKode(b.kode)}</code></td>
                      <td>{b.nama}</td>
                      <td>{b.satuan}</td>
                      <td>
                        <span className="stock-cell">
                          <span className="stock-num">{b.stok}</span>
                          {stat.show && (
                            <span className={`stock-badge stock-badge-${stat.variant}`}>
                              {stat.label}
                            </span>
                          )}
                        </span>
                      </td>
                      <td>
                        {b.deskripsi ? (
                          <span className="text-truncate" title={b.deskripsi}>
                            {b.deskripsi}
                          </span>
                        ) : (
                          <span className="app-muted">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="row-actions">
                          <button
                            type="button"
                            className="icon-btn icon-btn-edit"
                            onClick={() => openEdit(b)}
                            title="Edit barang"
                            aria-label={`Edit ${b.nama}`}
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn icon-btn-danger"
                            onClick={() => setDeleteTarget({ id: b.id, nama: b.nama })}
                            title="Hapus barang"
                            aria-label={`Hapus ${b.nama}`}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ============ FOOTER: pagination + total ============ */}
          <div className="pagination">
            <div>
              Menampilkan <strong>{visible.length}</strong> dari <strong>{filtered.length}</strong> barang
              {search && ` (dari total ${barang.length})`}
            </div>
            <div className="pagination-controls">
              <label>
                Per halaman:&nbsp;
                <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                  {PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
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
              <span>{safePage} / {totalPages}</span>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                title="Berikutnya"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ MODAL: Tambah / Edit Barang ============ */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-barang-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Edit Barang" : "Tambah Barang"}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={submitLoading}
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            {editingId && (
              <p className="modal-subtitle">
                Kode <strong>{formatBarangKode(form.kode)}</strong>
              </p>
            )}
            <div className="modal-divider" />

            <form onSubmit={handleSubmit}>
              {/* Kode barang: bisa diubah saat edit, format tampilan ATK-00078 */}
              {editingId && (
                <>
                  <label>Kode <span className="required">*</span></label>
                  <input
                    type="text"
                    value={form.kode}
                    onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value.toUpperCase() }))}
                    placeholder="ATK-00078"
                    required
                  />
                </>
              )}

              <label>Nama <span className="required">*</span></label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                placeholder="Pulpen BIC Hitam"
                required
                autoFocus={!editingId}
              />

              <label>Satuan <span className="required">*</span></label>
              <select
                value={form.satuan}
                onChange={(e) => setForm((f) => ({ ...f, satuan: e.target.value }))}
                required
              >
                <option value="" disabled>
                  Pilih satuan
                </option>
                {SATUAN_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
                {/* Kompatibilitas data lama jika satuan sebelumnya di luar daftar opsi */}
                {form.satuan && !SATUAN_OPTIONS.includes(form.satuan) && (
                  <option value={form.satuan}>{form.satuan} (data lama)</option>
                )}
              </select>

              {/* Stok & Stok Minimum — berdampingan agar hemat tinggi */}
              <div className="form-row-2col">
                <div>
                  <label>Stok awal</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stok}
                    onChange={(e) => setForm((f) => ({ ...f, stok: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  {/* Label kecil di kanan menjelaskan fungsi, gantikan form-hint panjang di bawah */}
                  <label>
                    Stok minimum <span className="label-aux">— alert Dashboard</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stokMinimum}
                    onChange={(e) => setForm((f) => ({ ...f, stokMinimum: e.target.value }))}
                    placeholder="opsional"
                  />
                </div>
              </div>

              <label>Deskripsi <span className="label-aux">— untuk staff</span></label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Pulpen standar, tinta biru"
                rows={3}
              />

              <label>Gambar</label>
              <div className="form-image-upload">
                <div className="form-image-preview">
                  {(imagePreviewUrl || form.gambarUrl) ? (
                    <img
                      src={imagePreviewUrl || resolveBarangImageSrc(form.gambarUrl)}
                      alt="Preview"
                    />
                  ) : (
                    <span className="form-image-placeholder">
                      <i className="fa-solid fa-image" /> Pilih gambar
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={onImageChange}
                  className="form-image-input"
                />
                <p className="form-image-hint">JPEG/PNG/WebP · maks 5 MB</p>
              </div>

              {/* Error inline dari server */}
              {modalError && (
                <div className="form-error">
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="modal-actions-block">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={submitLoading}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={submitLoading}>
                  {submitLoading
                    ? "Menyimpan..."
                    : editingId ? "Simpan Perubahan" : "Tambah Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: Konfirmasi Hapus ============ */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <span className="modal-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </span>
            </div>
            <h2 className="modal-text-center">Hapus Barang?</h2>
            <p className="modal-text-center app-muted" style={{ marginBottom: "1rem" }}>
              Yakin ingin menghapus <strong>{deleteTarget.nama}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: "#dc2626", borderColor: "#b91c1c" }}
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ LIGHTBOX: Preview Gambar ============ */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightboxUrl(null)}
            title="Tutup"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
