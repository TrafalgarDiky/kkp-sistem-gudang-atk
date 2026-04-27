"use client";

/**
 * Katalog ATK — Staff
 *
 * Fitur:
 * - Card barang dengan tombol "+ Keranjang" dinamis (kalau sudah di cart,
 *   berubah jadi "✓ Di keranjang (N)" + klik buka drawer).
 * - Modal Detail: lihat info lengkap + set qty spesifik → Tambah ke Keranjang.
 * - FAB pojok kanan bawah dengan badge jumlah jenis barang di keranjang.
 * - Drawer keranjang slide dari kanan, edit qty, hapus item, submit semua
 *   sebagai 1 permintaan ke /api/permintaan.
 * - Toast feedback, tetap di halaman katalog setelah submit sukses.
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders, resolveBarangImageSrc } from "@/lib/api";
import { SATUAN_OPTIONS, normalizeSatuan } from "@/lib/satuan-options";
import { useCart } from "@/lib/useCart";
import CartDrawer from "@/components/cart/CartDrawer";

export default function StaffBarang() {
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailBarang, setDetailBarang] = useState(null);
  const [jumlah, setJumlah] = useState(1);
  const [modalError, setModalError] = useState("");

  // Filter
  const [search, setSearch] = useState("");
  const [filterSatuan, setFilterSatuan] = useState("");
  const [filterKategori, setFilterKategori] = useState("SEMUA");

  // Keranjang
  const { items, count, addItem, updateQty, getItem, isInCart, clear } =
    useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

  // ========== Fetch ==========

  const fetchBarang = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/barang"), {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        const normalized = (data.data?.barang || []).map((b) => ({
          ...b,
          satuan: normalizeSatuan(b.satuan),
        }));
        setBarang(normalized);
      }
      else setError(data.message || "Gagal memuat barang");
    } catch {
      setError("Koneksi gagal. Pastikan backend jalan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, []);

  // ========== Derived ==========

  // Filter satuan hanya menampilkan daftar baku.
  const satuanList = SATUAN_OPTIONS.filter((s) =>
    barang.some((b) => normalizeSatuan(b.satuan) === s)
  );

  const getKategori = (nama = "", satuan = "") => {
    const n = nama.toLowerCase();
    const s = satuan.toLowerCase();
    if (
      s.includes("rim") ||
      s.includes("lembar") ||
      n.includes("kertas") ||
      n.includes("folio") ||
      n.includes("quarto")
    )
      return "KERTAS";
    if (
      n.includes("pena") ||
      n.includes("pulpen") ||
      n.includes("pensil") ||
      n.includes("spidol") ||
      n.includes("stabilo") ||
      n.includes("penghapus") ||
      n.includes("cutter") ||
      n.includes("gunting")
    )
      return "ALAT_TULIS";
    return "LAINNYA";
  };

  const filteredBarang = barang.filter((b) => {
    const matchSearch =
      !search || b.nama.toLowerCase().includes(search.toLowerCase());
    const matchSatuan = !filterSatuan || normalizeSatuan(b.satuan) === filterSatuan;
    const kategori = getKategori(b.nama, b.satuan);
    const matchKategori =
      filterKategori === "SEMUA" || kategori === filterKategori;
    return matchSearch && matchSatuan && matchKategori;
  });

  const getStokClass = (stok) => {
    if (stok <= 0) return "stok-badge stok-badge-danger";
    if (stok <= 5) return "stok-badge stok-badge-warning";
    return "stok-badge stok-badge-safe";
  };

  // ========== Handlers ==========

  const openDetail = (b) => {
    setDetailBarang(b);
    // preset qty: kalau sudah di cart, isi sesuai qty di cart, selainnya 1
    const cartItem = getItem(b.id);
    setJumlah(cartItem ? cartItem.jumlah : 1);
    setModalError("");
  };

  /**
   * Tambah ke keranjang dari card (klik tombol "+ Keranjang").
   * Qty langsung 1. Kalau sudah ada, otomatis nambah 1 (cap ke stok).
   */
  const handleQuickAdd = (b) => {
    if (b.stok <= 0) {
      showToast("Stok habis, tidak bisa ditambahkan", "error");
      return;
    }
    // Kalau sudah di cart dan sudah mentok stok, jangan tambah lagi
    const existing = getItem(b.id);
    if (existing && existing.jumlah >= b.stok) {
      showToast(`Qty sudah maksimal stok (${b.stok})`, "error");
      return;
    }
    addItem(b, 1);
    showToast(`${b.nama} ditambahkan ke keranjang`, "success");
  };

  /**
   * Tambah ke keranjang dari modal Detail (dengan qty custom).
   */
  const handleAddFromDetail = (e) => {
    e.preventDefault();
    if (!detailBarang) return;
    if (jumlah < 1) {
      setModalError("Jumlah minimal 1");
      return;
    }
    if (jumlah > detailBarang.stok) {
      setModalError(`Jumlah melebihi stok (stok: ${detailBarang.stok}).`);
      return;
    }
    // Qty dari modal selalu SET MUTLAK (bukan tambah).
    // Kalau sudah ada di cart: updateQty (set exact value).
    // Kalau belum ada: addItem baru.
    const existing = getItem(detailBarang.id);
    if (existing) {
      updateQty(detailBarang.id, jumlah);
      showToast(
        `${detailBarang.nama} di keranjang diubah jadi ${jumlah}`,
        "success"
      );
    } else {
      addItem(detailBarang, jumlah);
      showToast(
        `${detailBarang.nama} ditambahkan ke keranjang`,
        "success"
      );
    }
    setDetailBarang(null);
  };

  /**
   * Submit seluruh keranjang sebagai 1 permintaan.
   */
  const handleSubmitCart = async () => {
    if (items.length === 0) return;
    setSubmitLoading(true);
    try {
      const res = await fetch(apiUrl("/api/permintaan"), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({
            barangId: it.barangId,
            jumlah: it.jumlah,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        clear();
        setCartOpen(false);
        showToast("Permintaan berhasil diajukan", "success");
        fetchBarang(); // refresh stok setelah permintaan dibuat
      } else {
        showToast(
          data.message || "Gagal mengajukan permintaan",
          "error"
        );
      }
    } catch {
      showToast("Koneksi gagal. Cek backend dan jaringan.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ========== Render ==========

  return (
    <main className="app-content">
      <h1>Katalog ATK</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Cari barang, tambahkan ke keranjang, lalu ajukan semuanya sekaligus
        lewat tombol keranjang di pojok kanan bawah.
      </p>

      {error && <p className="app-error">{error}</p>}

      {!loading && barang.length > 0 && (
        <div className="katalog-toolbar">
          <div className="katalog-search-wrap">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Cari nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="katalog-search"
            />
          </div>
          <select
            value={filterSatuan}
            onChange={(e) => setFilterSatuan(e.target.value)}
            className="katalog-filter"
          >
            <option value="">Semua satuan</option>
            {satuanList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="katalog-filter"
          >
            <option value="SEMUA">Semua kategori</option>
            <option value="ALAT_TULIS">Alat Tulis</option>
            <option value="KERTAS">Kertas</option>
            <option value="LAINNYA">Lainnya</option>
          </select>
        </div>
      )}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : barang.length === 0 ? (
        <p className="app-muted">Belum ada barang.</p>
      ) : filteredBarang.length === 0 ? (
        <p className="app-muted">Tidak ada barang yang cocok dengan filter.</p>
      ) : (
        <div className="barang-cards">
          {filteredBarang.map((b) => {
            const inCart = isInCart(b.id);
            const inCartQty = inCart ? getItem(b.id)?.jumlah || 0 : 0;
            const stokHabis = b.stok <= 0;
            return (
              <div
                key={b.id}
                className="barang-card barang-card-clickable"
                onClick={() => openDetail(b)}
                onKeyDown={(e) => e.key === "Enter" && openDetail(b)}
                role="button"
                tabIndex={0}
              >
                <div className="barang-card-image">
                  {b.gambarUrl ? (
                    <img
                      src={resolveBarangImageSrc(b.gambarUrl)}
                      alt={b.nama}
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <span className="barang-card-placeholder">
                      <i className="fa-solid fa-box" />
                    </span>
                  )}
                </div>
                <div className="barang-card-body">
                  <h3 className="barang-card-name">{b.nama}</h3>
                  <p className="barang-card-meta">{b.satuan}</p>
                  <div style={{ marginTop: "0.45rem", marginBottom: "0.65rem" }}>
                    <span className={getStokClass(b.stok)}>Stok {b.stok}</span>
                  </div>

                  {/* Tombol dinamis: Habis / Di keranjang / Tambah */}
                  {stokHabis ? (
                    <button
                      type="button"
                      className="btn-secondary katalog-cta-btn"
                      disabled
                      onClick={(e) => e.stopPropagation()}
                    >
                      Stok habis
                    </button>
                  ) : inCart ? (
                    <button
                      type="button"
                      className="btn-secondary katalog-cta-btn"
                      style={{
                        color: "var(--success)",
                        borderColor: "#bbf7d0",
                        background: "#f0fdf4",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCartOpen(true);
                      }}
                      title="Buka keranjang"
                    >
                      <i className="fa-solid fa-check" /> Di keranjang ({inCartQty})
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary katalog-cta-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(b);
                      }}
                    >
                      <i className="fa-solid fa-cart-plus" /> Keranjang
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============ MODAL DETAIL BARANG ============ */}
      {detailBarang && (
        <div className="modal-overlay" onClick={() => setDetailBarang(null)}>
          <div
            className="modal-box modal-detail-barang"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Detail barang</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDetailBarang(null)}
                title="Tutup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-divider" />

            <div className="detail-barang-image">
              {detailBarang.gambarUrl ? (
                <img
                  src={resolveBarangImageSrc(detailBarang.gambarUrl)}
                  alt={detailBarang.nama}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <span className="barang-card-placeholder">
                  <i className="fa-solid fa-box" />
                </span>
              )}
            </div>

            <p>
              <strong>{detailBarang.nama}</strong>
            </p>
            <p>
              <strong>Deskripsi:</strong>
              <br />
              <span className="app-muted">
                {detailBarang.deskripsi || "Tidak ada deskripsi."}
              </span>
            </p>
            <p>
              Satuan: <strong>{detailBarang.satuan}</strong> · Stok tersedia:{" "}
              <strong>{detailBarang.stok}</strong>
            </p>

            {isInCart(detailBarang.id) && (
              <p
                className="app-muted"
                style={{
                  fontSize: "0.82rem",
                  background: "#f0fdf4",
                  color: "var(--success)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <i className="fa-solid fa-info-circle" /> Sudah ada{" "}
                <strong>{getItem(detailBarang.id)?.jumlah}</strong> di keranjang.
                Ubah jumlah di bawah untuk menggantinya.
              </p>
            )}

            <form onSubmit={handleAddFromDetail}>
              {modalError && (
                <p className="app-error" style={{ marginBottom: "0.75rem" }}>
                  {modalError}
                </p>
              )}
              <label>Jumlah yang diinginkan</label>
              <input
                type="number"
                min="1"
                max={detailBarang.stok}
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value) || 0)}
                disabled={detailBarang.stok <= 0}
              />
              <div className="modal-actions-block">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDetailBarang(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={jumlah < 1 || detailBarang.stok <= 0}
                >
                  <i className="fa-solid fa-cart-plus" />{" "}
                  {isInCart(detailBarang.id)
                    ? "Ubah di Keranjang"
                    : "Tambah ke Keranjang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ FAB KERANJANG ============ */}
      {count > 0 && !cartOpen && (
        <button
          type="button"
          className="cart-fab"
          onClick={() => setCartOpen(true)}
          title={`Buka keranjang (${count} jenis)`}
          aria-label={`Buka keranjang, ${count} jenis barang`}
        >
          <i className="fa-solid fa-cart-shopping" />
          <span className="cart-fab-badge">{count > 99 ? "99+" : count}</span>
        </button>
      )}

      {/* ============ CART DRAWER ============ */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => !submitLoading && setCartOpen(false)}
        onSubmit={handleSubmitCart}
        submitLoading={submitLoading}
      />

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
