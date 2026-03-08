"use client";

/** Barang — tampilan tabel + CRUD + upload gambar (Admin) */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

const initialForm = { nama: "", satuan: "", stok: "", stokMinimum: "", deskripsi: "", gambarUrl: "" };

export default function AdminBarang() {
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

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
      nama: b.nama || "",
      satuan: b.satuan || "",
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
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setImageFile(null);
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
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
    setError("");
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
          setError(upData.message || "Gagal upload gambar");
          setSubmitLoading(false);
          return;
        }
        gambarUrl = upData.data?.url || null;
      }
      const url = editingId
        ? apiUrl(`/api/barang/${editingId}`)
        : apiUrl("/api/barang");
      const method = editingId ? "PATCH" : "POST";
      const body = {
        nama: form.nama.trim(),
        satuan: form.satuan.trim(),
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
        setError(data.message || "Gagal menyimpan");
      }
    } catch (err) {
      setError("Koneksi gagal");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus barang ini?")) return;
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/barang/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteId(null);
        fetchBarang();
      } else {
        setError(data.message || "Gagal menghapus");
      }
    } catch (err) {
      setError("Koneksi gagal");
    }
  };

  return (
    <main className="app-content">
      <div className="page-head">
        <h1>Barang</h1>
        <button type="button" className="btn-primary" onClick={openTambah}>
          <i className="fa-solid fa-plus" /> Tambah Barang
        </button>
      </div>

      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : barang.length === 0 ? (
        <p className="app-muted">Belum ada barang.</p>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Satuan</th>
                <th>Stok</th>
                <th>Deskripsi</th>
                <th>Gambar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {barang.map((b, i) => (
                <tr key={b.id}>
                  <td>{i + 1}</td>
                  <td>{b.nama}</td>
                  <td>{b.satuan}</td>
                  <td>{b.stok}</td>
                  <td>{b.deskripsi || "-"}</td>
                  <td>
                    {b.gambarUrl ? (
                      <a href={b.gambarUrl} target="_blank" rel="noopener noreferrer">
                        Lihat
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-sm btn-edit"
                      onClick={() => openEdit(b)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      onClick={() => setDeleteId(b.id)}
                    >
                      Hapus
                    </button>
                    {deleteId === b.id && (
                      <span className="confirm-wrap">
                        Hapus?{" "}
                        <button type="button" onClick={() => handleDelete(b.id)}>
                          Ya
                        </button>
                        <button type="button" onClick={() => setDeleteId(null)}>
                          Batal
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit Barang" : "Tambah Barang"}</h2>
            <form onSubmit={handleSubmit}>
              <label>Nama <span className="required">*</span></label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                placeholder="Nama barang"
                required
              />
              <label>Satuan <span className="required">*</span></label>
              <input
                type="text"
                value={form.satuan}
                onChange={(e) => setForm((f) => ({ ...f, satuan: e.target.value }))}
                placeholder="buah, box, pack, dll."
                required
              />
              <label>Stok</label>
              <input
                type="number"
                min="0"
                value={form.stok}
                onChange={(e) => setForm((f) => ({ ...f, stok: e.target.value }))}
                placeholder="0"
              />
              <label>Stok minimum (opsional — untuk alert stok menipis di Dashboard)</label>
              <input
                type="number"
                min="0"
                value={form.stokMinimum}
                onChange={(e) => setForm((f) => ({ ...f, stokMinimum: e.target.value }))}
                placeholder="Kosongkan jika tidak dipakai"
              />
              <label>Deskripsi (tampil di popup detail barang untuk Staff)</label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Contoh: Pulpen standar kantor, tinta biru"
                rows={3}
              />
              <label>Gambar barang</label>
              <div className="form-image-upload">
                <div className="form-image-preview">
                  {(imagePreviewUrl || form.gambarUrl) ? (
                    <img src={imagePreviewUrl || form.gambarUrl} alt="Preview" />
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
                <p className="form-image-hint">JPEG, PNG, GIF atau WebP. Maks. 5 MB.</p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={submitLoading}>
                  {submitLoading ? "Menyimpan..." : editingId ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
