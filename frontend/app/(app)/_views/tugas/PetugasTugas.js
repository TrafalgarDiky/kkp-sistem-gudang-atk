"use client";

/**
 * Tugas Aktif — Petugas: daftar tugas pengantaran, Mulai Antar, Detail Tugas, Konfirmasi Selesai/Serah terima.
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

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
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
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
      t.statusTugas !== "DELIVERED"
  );

  const handleMulaiAntar = async (tugasId) => {
    setUpdatingId(tugasId);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/permintaan/tugas/${tugasId}/ambil`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
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
      const res = await fetch(apiUrl(`/api/permintaan/tugas/${tugasId}/lepas`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
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

  return (
    <main className="app-content">
      <h1>Tugas Aktif</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Daftar permintaan yang harus diantar. Klik &quot;Mulai Antar&quot; untuk mengambil tugas, lalu &quot;Detail&quot; untuk melihat info lengkap dan konfirmasi serah terima.
      </p>
      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : tugasAktif.length === 0 ? (
        <p className="app-muted">Tidak ada tugas aktif. Lihat <a href="/permintaan/riwayat" style={{ color: "#8b5cf6" }}>Riwayat Tugas</a> untuk pengantaran yang sudah selesai.</p>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Nomor / Tanggal</th>
                <th>Peminta (Staff)</th>
                <th>Jumlah barang</th>
                <th>Status pengantaran</th>
                <th>Diambil oleh</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tugasAktif.map((t) => {
                const isDitolak = t.permintaan?.statusAdmin === "DITOLAK_ADMIN" || t.statusTugas === "DITOLAK";
                const statusDisplay = isDitolak ? "DITOLAK" : t.statusTugas;
                const isTakenByMe = t.petugasId === currentUserId;
                const isTakenByOther = t.petugasId && t.petugasId !== currentUserId;
                const canMulaiAntar = !isDitolak && t.statusTugas === "MENUNGGU_ASSIGN" && !t.petugasId;
                const canLepas = !isDitolak && isTakenByMe && !["SELESAI", "DELIVERED"].includes(t.statusTugas);
                const canSelesai = !isDitolak && isTakenByMe && ["MENUNGGU_ASSIGN", "DALAM_PROSES", "ON_DELIVERY"].includes(t.statusTugas);
                const totalItem = t.permintaan?.items?.reduce((s, it) => s + (it.jumlah || 0), 0) ?? 0;

                return (
                  <tr key={t.id}>
                    <td>
                      {new Date(t.permintaan?.createdAt).toLocaleDateString("id-ID")}
                      <span className="app-muted" style={{ fontSize: "0.8rem", display: "block" }}>
                        #{String(t.permintaanId || t.permintaan?.id || "").slice(0, 8)}
                      </span>
                    </td>
                    <td>{t.permintaan?.peminta?.nama}</td>
                    <td>{totalItem} item</td>
                    <td>
                      <span className={`badge badge-${statusDisplay}`}>
                        {statusTugasLabel[statusDisplay] || (isDitolak ? "Ditolak" : t.statusTugas)}
                      </span>
                    </td>
                    <td>{t.petugas?.nama ?? "—"}</td>
                    <td>
                      {isTakenByOther && (
                        <span className="app-muted">Sedang diambil {t.petugas?.nama || "petugas lain"}</span>
                      )}
                      {canMulaiAntar && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem", marginRight: "0.35rem" }}
                          disabled={updatingId === t.id}
                          onClick={() => handleMulaiAntar(t.id)}
                        >
                          {updatingId === t.id ? "..." : "Mulai Antar"}
                        </button>
                      )}
                      {(isTakenByMe || (!t.petugasId && t.statusTugas === "MENUNGGU_ASSIGN")) && (
                        <button
                          type="button"
                          className="btn-sm btn-edit"
                          style={{ marginRight: "0.35rem" }}
                          onClick={() => setDetailTugas(t)}
                        >
                          Detail
                        </button>
                      )}
                      {canLepas && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem", marginRight: "0.35rem" }}
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
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <h2>Detail Tugas</h2>
            <p><strong>Data peminta</strong><br />
              {detailTugas.permintaan?.peminta?.nama} ({detailTugas.permintaan?.peminta?.email})
            </p>
            <p><strong>Daftar barang yang harus diantar</strong></p>
            <ul style={{ marginLeft: "1.25rem", marginBottom: "0.75rem" }}>
              {detailTugas.permintaan?.items?.map((it) => (
                <li key={it.id}>
                  {it.barang?.nama} × {it.jumlah} {it.barang?.satuan}
                </li>
              ))}
            </ul>
            <p><strong>Catatan admin/staff</strong><br />
              <span className="app-muted">{detailTugas.permintaan?.catatanAdmin || "—"}</span>
            </p>
            {detailTugas.petugasId === currentUserId &&
             ["MENUNGGU_ASSIGN", "DALAM_PROSES", "ON_DELIVERY"].includes(detailTugas.statusTugas) &&
             detailTugas.permintaan?.statusAdmin !== "DITOLAK_ADMIN" && (
              <div className="modal-actions" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setDetailTugas(null)}>
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={updatingId === detailTugas.id}
                  onClick={() => handleKonfirmasiSelesai(detailTugas.id)}
                >
                  {updatingId === detailTugas.id ? "..." : "Konfirmasi sudah diterima"}
                </button>
              </div>
            )}
            {(!detailTugas.petugasId || detailTugas.petugasId !== currentUserId) && (
              <div className="modal-actions" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setDetailTugas(null)}>
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
