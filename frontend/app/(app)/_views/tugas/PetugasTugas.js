"use client";

/**
 * Tugas Aktif — Petugas: daftar tugas pengantaran, Mulai Antar, Detail Tugas, Konfirmasi Selesai/Serah terima.
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders, resolveBarangImageSrc } from "@/lib/api";

const statusTugasLabel = {
  MENUNGGU_ASSIGN: "Menunggu",
  ON_DELIVERY: "Sedang diantar",
  DELIVERED: "Selesai",
  DALAM_PROSES: "Dalam proses",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
};

export default function PetugasTugas() {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [detailTugas, setDetailTugas] = useState(null);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) {
        const u = JSON.parse(raw);
        setCurrentUserId(u?.id ?? null);
      }
    } catch (_) {}
  }, []);

  const fetchTugas = async () => {
    setError("");
    try {
      const res = await fetch(apiUrl("/api/permintaan/tugas"), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setTugas(data.data?.tugas || []);
      else setError(data.message || "Gagal memuat tugas");
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTugas();
  }, []);

  const tugasAktif = tugas.filter(
    (t) =>
      t.permintaan?.statusAdmin !== "DITOLAK_ADMIN" &&
      t.statusTugas !== "DITOLAK" &&
      t.statusTugas !== "SELESAI" &&
      t.statusTugas !== "DELIVERED",
  );

  const handleMulaiAntar = async (tugasId) => {
    setUpdatingId(tugasId);
    setError("");
    try {
      const res = await fetch(
        apiUrl(`/api/permintaan/tugas/${tugasId}/ambil`),
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      if (data.success) {
        fetchTugas();
        setDetailTugas(null);
      } else setError(data.message || "Gagal mengambil tugas");
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLepas = async (tugasId) => {
    setUpdatingId(tugasId);
    setError("");
    try {
      const res = await fetch(
        apiUrl(`/api/permintaan/tugas/${tugasId}/lepas`),
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );
      const data = await res.json();
      if (data.success) {
        fetchTugas();
        setDetailTugas(null);
      } else setError(data.message || "Gagal melepas");
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleKonfirmasiSelesai = async (tugasId) => {
    setUpdatingId(tugasId);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/permintaan/tugas/${tugasId}`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ statusTugas: "SELESAI" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTugas();
        setDetailTugas(null);
      } else setError(data.message || "Gagal mengupdate");
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenDetail = async (t) => {
    setDetailTugas(t);
    try {
      const res = await fetch(apiUrl(`/api/permintaan/${t.permintaanId}`), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success || !data.data?.permintaan) return;
      setDetailTugas((prev) =>
        prev && prev.id === t.id
          ? { ...prev, permintaan: { ...prev.permintaan, ...data.data.permintaan } }
          : prev,
      );
    } catch (_) {
      // fallback: tetap pakai data list jika fetch detail gagal
    }
  };

  return (
    <main className="app-content">
      <h1>Tugas Aktif</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Daftar permintaan yang harus diantar. Klik &quot;Mulai Antar&quot; untuk
        mengambil tugas, lalu &quot;Detail&quot; untuk melihat info lengkap dan
        konfirmasi serah terima.
      </p>
      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : tugasAktif.length === 0 ? (
        <p className="app-muted">
          Tidak ada tugas aktif. Lihat{" "}
          <a href="/permintaan/riwayat" style={{ color: "#8b5cf6" }}>
            Riwayat Tugas
          </a>{" "}
          untuk pengantaran yang sudah selesai.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Nomor / Tanggal</th>
                <th>Peminta (Staff)</th>
                <th>Nama barang</th>
                <th>Jumlah barang</th>
                <th>Status pengantaran</th>
                <th>Diambil oleh</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tugasAktif.map((t) => {
                const isDitolak =
                  t.permintaan?.statusAdmin === "DITOLAK_ADMIN" ||
                  t.statusTugas === "DITOLAK";
                const statusDisplay = isDitolak ? "DITOLAK" : t.statusTugas;
                const isTakenByMe = t.petugasId === currentUserId;
                const isTakenByOther =
                  t.petugasId && t.petugasId !== currentUserId;
                const canMulaiAntar =
                  !isDitolak &&
                  t.statusTugas === "MENUNGGU_ASSIGN" &&
                  !t.petugasId;
                const canLepas =
                  !isDitolak &&
                  isTakenByMe &&
                  !["SELESAI", "DELIVERED"].includes(t.statusTugas);
                const canSelesai =
                  !isDitolak &&
                  isTakenByMe &&
                  ["MENUNGGU_ASSIGN", "DALAM_PROSES", "ON_DELIVERY"].includes(
                    t.statusTugas,
                  );
                const totalItem =
                  t.permintaan?.items?.reduce(
                    (s, it) => s + (it.jumlah || 0),
                    0,
                  ) ?? 0;
                const namaBarang =
                  t.permintaan?.items
                    ?.map((it) => it.barang?.nama)
                    .filter(Boolean)
                    .join(", ") || "—";

                return (
                  <tr key={t.id}>
                    <td>
                      {new Date(t.permintaan?.createdAt).toLocaleDateString(
                        "id-ID",
                      )}
                      <span
                        className="app-muted"
                        style={{ fontSize: "0.8rem", display: "block" }}
                      >
                        #
                        {String(t.permintaanId || t.permintaan?.id || "").slice(
                          0,
                          8,
                        )}
                      </span>
                    </td>
                    <td>{t.permintaan?.peminta?.nama}</td>
                    <td>{namaBarang}</td>
                    <td>{totalItem} item</td>
                    <td>
                      <span className={`badge badge-${statusDisplay}`}>
                        {statusTugasLabel[statusDisplay] ||
                          (isDitolak ? "Ditolak" : t.statusTugas)}
                      </span>
                    </td>
                    <td>{t.petugas?.nama ?? "—"}</td>
                    <td>
                      {isTakenByOther && (
                        <span className="app-muted">
                          Sedang diambil {t.petugas?.nama || "petugas lain"}
                        </span>
                      )}
                      {canMulaiAntar && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.85rem",
                            marginRight: "0.35rem",
                          }}
                          disabled={updatingId === t.id}
                          onClick={() => handleMulaiAntar(t.id)}
                        >
                          {updatingId === t.id ? "..." : "Mulai Antar"}
                        </button>
                      )}
                      {(isTakenByMe ||
                        (!t.petugasId &&
                          t.statusTugas === "MENUNGGU_ASSIGN")) && (
                        <button
                          type="button"
                          className="btn-sm btn-edit"
                          style={{ marginRight: "0.35rem" }}
                          onClick={() => handleOpenDetail(t)}
                        >
                          Detail
                        </button>
                      )}
                      {canLepas && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.85rem",
                            marginRight: "0.35rem",
                          }}
                          disabled={updatingId === t.id}
                          onClick={() => handleLepas(t.id)}
                        >
                          {updatingId === t.id ? "..." : "Lepas"}
                        </button>
                      )}
                      {canSelesai && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.85rem",
                          }}
                          disabled={updatingId === t.id}
                          onClick={() => handleKonfirmasiSelesai(t.id)}
                        >
                          {updatingId === t.id ? "..." : "Konfirmasi Selesai"}
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

      {/* Modal Detail Tugas */}
      {detailTugas && (
        <div className="modal-overlay" onClick={() => setDetailTugas(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <h2>Detail Tugas</h2>
            <p>
              <strong>Data peminta</strong>
              <br />
              {detailTugas.permintaan?.peminta?.nama} (
              {detailTugas.permintaan?.peminta?.email})
            </p>
            <p>
              <strong>Daftar barang yang harus diantar</strong>
            </p>
            <div style={{ display: "grid", gap: "0.65rem", marginBottom: "0.75rem" }}>
              {detailTugas.permintaan?.items?.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    gap: "0.65rem",
                    alignItems: "center",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
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
                      referrerPolicy="no-referrer"
                      style={{
                        width: "52px",
                        height: "52px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "#fff",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "8px",
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
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.barang?.nama || "Nama barang tidak tersedia"}</div>
                    <div className="app-muted" style={{ fontSize: "0.88rem" }}>
                      {it.jumlah} {it.barang?.satuan}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p>
              <strong>Catatan admin/staff</strong>
              <br />
              <span className="app-muted">
                {detailTugas.permintaan?.catatanAdmin || "—"}
              </span>
            </p>
            {detailTugas.petugasId === currentUserId &&
              ["MENUNGGU_ASSIGN", "DALAM_PROSES", "ON_DELIVERY"].includes(
                detailTugas.statusTugas,
              ) &&
              detailTugas.permintaan?.statusAdmin !== "DITOLAK_ADMIN" && (
                <div className="modal-actions" style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setDetailTugas(null)}
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={updatingId === detailTugas.id}
                    onClick={() => handleKonfirmasiSelesai(detailTugas.id)}
                  >
                    {updatingId === detailTugas.id
                      ? "..."
                      : "Konfirmasi sudah diterima"}
                  </button>
                </div>
              )}
            {(!detailTugas.petugasId ||
              detailTugas.petugasId !== currentUserId) && (
              <div className="modal-actions" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDetailTugas(null)}
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
