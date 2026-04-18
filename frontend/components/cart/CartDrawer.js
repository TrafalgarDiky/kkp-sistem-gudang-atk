"use client";

/**
 * CartDrawer — panel keranjang yang slide dari kanan.
 *
 * Tujuan:
 *   Menampilkan isi keranjang permintaan barang, mengubah qty,
 *   menghapus item, dan men-submit semua item sebagai 1 permintaan.
 *
 * Props:
 *   - isOpen: boolean    — drawer terbuka atau tidak
 *   - onClose: () => void — handler tutup drawer
 *   - onSubmit: () => void — handler klik tombol "Ajukan Permintaan"
 *   - submitLoading: boolean — state loading saat sedang submit
 *
 * State cart diambil langsung dari hook useCart — tidak perlu props items,
 * karena hook otomatis sinkron via CustomEvent.
 */
import { useCart } from "@/lib/useCart";
import { resolveBarangImageSrc } from "@/lib/api";

export default function CartDrawer({
  isOpen,
  onClose,
  onSubmit,
  submitLoading = false,
}) {
  const { items, count, totalQty, updateQty, removeItem } = useCart();

  // Apakah ada item dengan qty > stok? (stok berubah sejak ditambahkan ke cart)
  const hasOverStock = items.some(
    (it) => (it.jumlah || 0) > (it.stok || 0)
  );

  // Tidak bisa submit kalau kosong, loading, atau ada item over-stock
  const canSubmit = count > 0 && !submitLoading && !hasOverStock;

  return (
    <>
      {/* Overlay gelap — klik untuk tutup */}
      <div
        className={`cart-drawer-overlay ${isOpen ? "is-open" : ""}`}
        onClick={submitLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Drawer panel (slide dari kanan) */}
      <aside
        className={`cart-drawer ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-label="Keranjang permintaan"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <h2>
            <i className="fa-solid fa-cart-shopping" />
            Keranjang
            {count > 0 && (
              <span className="pill pill-muted" style={{ marginLeft: "0.4rem" }}>
                {count} jenis
              </span>
            )}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={submitLoading}
            title="Tutup"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="cart-drawer-body">
          {count === 0 ? (
            <div className="cart-empty">
              <i className="fa-solid fa-cart-shopping" />
              <div className="cart-empty-title">Keranjang masih kosong</div>
              <p>
                Pilih barang dari katalog lalu klik <strong>+ Keranjang</strong>.
              </p>
            </div>
          ) : (
            items.map((it) => {
              const overStock = (it.jumlah || 0) > (it.stok || 0);
              return (
                <div key={it.barangId} className="cart-item">
                  {/* Thumbnail */}
                  <div className="cart-item-image">
                    {it.gambarUrl ? (
                      <img
                        src={resolveBarangImageSrc(it.gambarUrl)}
                        alt={it.nama}
                        loading="lazy"
                      />
                    ) : (
                      <i className="fa-solid fa-box" />
                    )}
                  </div>

                  {/* Nama + satuan */}
                  <div className="cart-item-info">
                    <p className="cart-item-name" title={it.nama}>
                      {it.nama}
                    </p>
                    <p className="cart-item-meta">
                      Satuan: <strong>{it.satuan}</strong> · Stok tersedia:{" "}
                      <strong>{it.stok}</strong>
                    </p>
                  </div>

                  {/* Qty control */}
                  <div className="cart-qty" aria-label="Ubah jumlah">
                    <button
                      type="button"
                      className="cart-qty-btn"
                      onClick={() =>
                        updateQty(it.barangId, (it.jumlah || 1) - 1)
                      }
                      disabled={submitLoading}
                      title="Kurangi"
                    >
                      <i className="fa-solid fa-minus" />
                    </button>
                    <input
                      type="number"
                      className="cart-qty-input"
                      value={it.jumlah}
                      min={1}
                      max={it.stok}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        updateQty(it.barangId, val);
                      }}
                      disabled={submitLoading}
                      aria-label={`Jumlah ${it.nama}`}
                    />
                    <button
                      type="button"
                      className="cart-qty-btn"
                      onClick={() =>
                        updateQty(it.barangId, (it.jumlah || 0) + 1)
                      }
                      disabled={submitLoading || it.jumlah >= it.stok}
                      title={
                        it.jumlah >= it.stok
                          ? "Sudah maksimal stok"
                          : "Tambah"
                      }
                    >
                      <i className="fa-solid fa-plus" />
                    </button>
                  </div>

                  {/* Baris aksi mini (hapus + warning) */}
                  <div className="cart-item-actions">
                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => removeItem(it.barangId)}
                      disabled={submitLoading}
                    >
                      <i className="fa-solid fa-trash" /> Hapus
                    </button>
                    {overStock && (
                      <span className="cart-item-stok-warn">
                        <i className="fa-solid fa-triangle-exclamation" /> Qty
                        melebihi stok ({it.stok})
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer dengan total & tombol ajukan */}
        {count > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-footer-row">
              <span className="app-muted">Total barang</span>
              <strong>
                {count} jenis · {totalQty} pcs
              </strong>
            </div>
            {hasOverStock && (
              <p
                className="app-error"
                style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}
              >
                <i className="fa-solid fa-triangle-exclamation" /> Ada item
                melebihi stok. Kurangi qty terlebih dulu.
              </p>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              {submitLoading ? (
                <>Mengirim...</>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane" /> Ajukan Permintaan
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
