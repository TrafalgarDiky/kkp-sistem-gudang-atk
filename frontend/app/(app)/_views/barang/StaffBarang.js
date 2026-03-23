"use client";

/**
 * Katalog ATK — Staff: card barang, klik gambar → detail (deskripsi, stok) + input jumlah → Minta Barang.
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export default function StaffBarang() {
  const [barang, setBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailBarang, setDetailBarang] = useState(null);
  const [jumlah, setJumlah] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [search, setSearch] = useState("");
  const [filterSatuan, setFilterSatuan] = useState("");
  const [filterKategori, setFilterKategori] = useState("SEMUA");

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

  const satuanList = [
    ...new Set(barang.map((b) => b.satuan).filter(Boolean)),
  ].sort();

  const getKategori = (nama = "", satuan = "") => {
    const n = nama.toLowerCase();
    const s = satuan.toLowerCase();
    if (
      s.includes("rim") ||
      s.includes("lembar") ||
      n.includes("kertas") ||
      n.includes("folio") ||
      n.includes("quarto")
    ) {
      return "KERTAS";
    }
    if (
      n.includes("pena") ||
      n.includes("pulpen") ||
      n.includes("pensil") ||
      n.includes("spidol") ||
      n.includes("stabilo") ||
      n.includes("penghapus") ||
      n.includes("cutter") ||
      n.includes("gunting")
    ) {
      return "ALAT_TULIS";
    }
    return "LAINNYA";
  };

  const filteredBarang = barang.filter((b) => {
    const matchSearch =
      !search || b.nama.toLowerCase().includes(search.toLowerCase());
    const matchSatuan = !filterSatuan || b.satuan === filterSatuan;
    const kategori = getKategori(b.nama, b.satuan);
    const matchKategori = filterKategori === "SEMUA" || kategori === filterKategori;
    return matchSearch && matchSatuan && matchKategori;
  });

  const getStokClass = (stok) => {
    if (stok <= 0) return "stok-badge stok-badge-danger";
    if (stok <= 5) return "stok-badge stok-badge-warning";
    return "stok-badge stok-badge-safe";
  };

  const openDetail = (b) => {
    setDetailBarang(b);
    setJumlah(1);
    setModalError("");
  };

  const handleMinta = async (e) => {
    e.preventDefault();
    if (!detailBarang || jumlah < 1) return;
    if (jumlah > detailBarang.stok) {
      setError(`Jumlah melebihi stok (stok: ${detailBarang.stok}).`);
      return;
    }
    setSubmitLoading(true);
    setError("");
    setModalError("");
    try {
      const res = await fetch(apiUrl("/api/permintaan"), {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ barangId: detailBarang.id, jumlah: Number(jumlah) }],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setDetailBarang(null);
        setModalError("");
        fetchBarang();
      } else {
        const msg = data.message || "Gagal mengirim permintaan";
        setModalError(msg);
        setError(msg);
      }
    } catch (err) {
      const msg = "Koneksi gagal. Cek backend dan jaringan.";
      setModalError(msg);
      setError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <main className="app-content">
      <h1>Katalog ATK</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Cari dan pilih barang, klik untuk detail dan ajukan permintaan.
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
          {filteredBarang.map((b) => (
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
                  <img src={b.gambarUrl} alt={b.nama} />
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
                <button
                  type="button"
                  className="btn-primary katalog-cta-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(b);
                  }}
                >
                  + Ajukan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailBarang && (
        <div className="modal-overlay" onClick={() => setDetailBarang(null)}>
          <div
            className="modal-box modal-detail-barang"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Detail barang</h2>
            <div className="detail-barang-image">
              {detailBarang.gambarUrl ? (
                <img src={detailBarang.gambarUrl} alt={detailBarang.nama} />
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
              Satuan: <strong>{detailBarang.satuan}</strong>
            </p>
            <p>
              Stok tersedia: <strong>{detailBarang.stok}</strong>
            </p>
            <form onSubmit={handleMinta}>
              {modalError && (
                <p className="app-error" style={{ marginBottom: "0.75rem" }}>
                  {modalError}
                </p>
              )}
              <label>Jumlah yang diminta</label>
              <input
                type="number"
                min="1"
                max={detailBarang.stok}
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value) || 0)}
              />
              <div className="modal-actions">
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
                  disabled={submitLoading || jumlah < 1}
                >
                  {submitLoading ? "Mengirim..." : "Minta Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
