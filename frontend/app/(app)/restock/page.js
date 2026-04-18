"use client";

/**
 * Barang Masuk (Restock) — Admin
 * - Form input via MODAL (klik tombol "+ Catat Barang Masuk")
 * - Tabel riwayat dengan search, filter periode, sort, pagination
 * - Toast notif setelah sukses simpan
 *
 * Endpoint: POST /api/restock, GET /api/restock, GET /api/barang
 */
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { UserCell, BarangCombobox } from "@/components/ui";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

/** Saran sumber barang masuk — bisa dipilih atau diketik bebas */
const SUMBER_PRESETS = ["Pembelian", "Donasi", "Hibah", "Retur Dinas", "Transfer Antar Unit"];

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
  try {
    return dt ? new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  } catch {
    return "—";
  }
}

// ====================== Page ======================

export default function BarangMasukPage() {
  const [user, setUser] = useState(null);
  const [barang, setBarang] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal form
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState({ barangId: "", jumlah: "", sumber: "", tanggal: "" });
  const [formError, setFormError] = useState("");

  // Search + filter periode + paginasi
  const [search, setSearch] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Toast
  const [toast, setToast] = useState(null); // { variant, message }

  // ====================== Effects ======================

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch (_) {}
    }
  }, []);

  const fetchBarang = async () => {
    try {
      const res = await fetch(apiUrl("/api/barang"), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setBarang(data.data?.barang || []);
    } catch (_) {}
  };

  const fetchRestock = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/restock"), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setList(data.data?.list || []);
      else setError(data.message || "Gagal memuat riwayat");
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchBarang();
    fetchRestock();
  }, [user?.role]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Reset page kalau filter berubah
  useEffect(() => {
    setPage(1);
  }, [search, dari, sampai, perPage]);

  // ====================== Filtering ======================

  /**
   * Filter daftar restock berdasarkan search + periode (dari–sampai).
   * Diurutkan dari tanggal terbaru.
   */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const dariTs = dari ? new Date(dari).getTime() : null;
    const sampaiTs = sampai ? new Date(sampai + "T23:59:59").getTime() : null;

    return list
      .filter((r) => {
        // search di nama barang, kode, sumber
        if (q) {
          const nama = (r.barang?.nama || "").toLowerCase();
          const kode = (r.barang?.kode || "").toLowerCase();
          const sumber = (r.sumber || "").toLowerCase();
          if (!nama.includes(q) && !kode.includes(q) && !sumber.includes(q)) return false;
        }
        // filter periode
        if (dariTs || sampaiTs) {
          const t = r.tanggal ? new Date(r.tanggal).getTime() : (r.createdAt ? new Date(r.createdAt).getTime() : null);
          if (!t) return false;
          if (dariTs && t < dariTs) return false;
          if (sampaiTs && t > sampaiTs) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ta = new Date(a.tanggal || a.createdAt || 0).getTime();
        const tb = new Date(b.tanggal || b.createdAt || 0).getTime();
        return tb - ta;
      });
  }, [list, search, dari, sampai]);

  const totalQty = useMemo(() => filtered.reduce((acc, r) => acc + (Number(r.jumlah) || 0), 0), [filtered]);

  // Slice paginasi
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const visible = filtered.slice(startIdx, startIdx + perPage);

  // ====================== Handlers ======================

  const openModal = () => {
    const today = new Date().toISOString().slice(0, 10);
    setForm({ barangId: "", jumlah: "", sumber: "", tanggal: today });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.barangId?.trim()) {
      setFormError("Pilih barang terlebih dahulu.");
      return;
    }
    if (!form.jumlah || Number(form.jumlah) <= 0) {
      setFormError("Jumlah harus lebih dari 0.");
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch(apiUrl("/api/restock"), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          barangId: form.barangId.trim(),
          jumlah: Number(form.jumlah),
          sumber: form.sumber?.trim() || null,
          tanggal: form.tanggal || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const namaBarang = barang.find((b) => b.id === form.barangId)?.nama || "barang";
        setToast({
          variant: "success",
          message: `Berhasil mencatat +${form.jumlah} ${namaBarang}.`,
        });
        setModalOpen(false);
        fetchRestock();
        fetchBarang(); // refresh stok terbaru
      } else {
        setFormError(data.message || "Gagal mencatat restock");
      }
    } catch (err) {
      setFormError("Koneksi gagal.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleExport = () => {
    const rows = [["Tanggal", "Barang", "Jumlah", "Satuan", "Sumber", "Dicatat oleh"]];
    for (const r of filtered) {
      rows.push([
        r.tanggal ? new Date(r.tanggal).toLocaleDateString("id-ID") : "",
        r.barang?.nama ?? "",
        String(r.jumlah ?? ""),
        r.barang?.satuan ?? "",
        r.sumber ?? "",
        r.admin?.nama ?? "",
      ]);
    }
    downloadCsv(`barang_masuk_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setToast({ variant: "info", message: "File CSV sedang diunduh." });
  };

  // ====================== Guards ======================

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Barang Masuk</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  // ====================== Render ======================

  return (
    <main className="app-content">
      {/* ============ TOOLBAR ============ */}
      <div className="list-toolbar">
        <h1>Barang Masuk</h1>
        <div className="list-toolbar-spacer" />

        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Cari barang atau sumber..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-box-clear" onClick={() => setSearch("")} title="Bersihkan">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

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

        <div className="list-toolbar-actions">
          <button type="button" className="btn-icon" onClick={handleExport} disabled={!filtered.length} title="Export ke CSV">
            <i className="fa-solid fa-download" />
            <span>Export</span>
          </button>
          <button type="button" className="btn-primary" onClick={openModal}>
            <i className="fa-solid fa-plus" /> Catat Barang Masuk
          </button>
        </div>
      </div>

      {error && <p className="app-error">{error}</p>}

      {/* ============ TABEL ============ */}
      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-truck-ramp-box" />
          <div className="empty-state-title">Belum ada barang masuk</div>
          <p className="empty-state-sub">Klik "Catat Barang Masuk" untuk mencatat yang pertama.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-magnifying-glass" />
          <div className="empty-state-title">Tidak ada hasil</div>
          <p className="empty-state-sub">Coba kata kunci lain atau atur ulang filter periode.</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Tanggal</th>
                  <th>Barang</th>
                  <th style={{ width: 110 }}>Jumlah</th>
                  <th>Sumber</th>
                  <th>Dicatat oleh</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td>{toIdDate(r.tanggal || r.createdAt)}</td>
                    <td>
                      {r.barang?.nama || "—"} <span className="app-muted">({r.barang?.satuan || "-"})</span>
                    </td>
                    <td>
                      <span className="pill pill-success">+{r.jumlah}</span>
                    </td>
                    <td>
                      {r.sumber
                        ? <span className="text-truncate" title={r.sumber}>{r.sumber}</span>
                        : <span className="app-muted">—</span>}
                    </td>
                    <td><UserCell name={r.admin?.nama} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============ FOOTER PAGINATION ============ */}
          <div className="pagination">
            <div>
              Menampilkan <strong>{visible.length}</strong> dari <strong>{filtered.length}</strong> entri
              {(search || dari || sampai) && ` (dari total ${list.length})`}
              &nbsp;•&nbsp;
              Total qty masuk: <strong style={{ color: "#047857" }}>+{totalQty}</strong>
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

      {/* ============ MODAL: Catat Barang Masuk ============ */}
      {modalOpen && (() => {
        const selectedBarang = barang.find((b) => b.id === form.barangId);
        const jumlahNum = Number(form.jumlah) || 0;
        const showStockPreview = selectedBarang && jumlahNum > 0;
        const stokBaru = selectedBarang ? (Number(selectedBarang.stok) || 0) + jumlahNum : 0;

        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Catat Barang Masuk</h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeModal}
                  disabled={submitLoading}
                  title="Tutup"
                  aria-label="Tutup"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <p className="modal-subtitle">Catat barang yang baru masuk ke gudang.</p>
              <div className="modal-divider" />

              <form onSubmit={handleSubmit}>
                <label>Barang <span className="required">*</span></label>
                <BarangCombobox
                  items={barang}
                  value={form.barangId}
                  onChange={(id) => setForm((f) => ({ ...f, barangId: id }))}
                />

                <label style={{ marginTop: "0.7rem" }}>Jumlah masuk <span className="required">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={form.jumlah}
                  onChange={(e) => setForm((f) => ({ ...f, jumlah: e.target.value }))}
                  placeholder="Contoh: 10"
                  required
                />

                {/* Preview stok: muncul setelah pilih barang + isi jumlah */}
                {showStockPreview && (
                  <div className="stock-preview">
                    <i className="fa-solid fa-circle-info" />
                    <span>Stok saat ini: <strong>{selectedBarang.stok}</strong></span>
                    <span className="stock-preview-arrow">→</span>
                    <span>akan menjadi <span className="stock-preview-new">{stokBaru}</span></span>
                    <span className="stock-preview-delta">+{jumlahNum}</span>
                  </div>
                )}

                <label style={{ marginTop: "0.7rem" }}>Sumber <span className="app-muted" style={{ fontWeight: 400 }}>(opsional)</span></label>
                <input
                  type="text"
                  list="sumber-suggestions"
                  value={form.sumber}
                  onChange={(e) => setForm((f) => ({ ...f, sumber: e.target.value }))}
                  placeholder="Pilih atau ketik sumber..."
                />
                <datalist id="sumber-suggestions">
                  {SUMBER_PRESETS.map((s) => <option key={s} value={s} />)}
                </datalist>

                <label style={{ marginTop: "0.7rem" }}>Tanggal <span className="app-muted" style={{ fontWeight: 400, fontSize: "0.78rem" }}>(default: hari ini)</span></label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                />

                {formError && (
                  <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.6rem" }}>{formError}</p>
                )}

                <div className="modal-actions-block">
                  <button type="button" className="btn-secondary" onClick={closeModal} disabled={submitLoading}>
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitLoading}>
                    {submitLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

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
