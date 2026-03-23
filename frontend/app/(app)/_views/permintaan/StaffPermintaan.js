"use client";

/**
 * Permintaan Saya — Staff: riwayat permintaan, filter status, detail (item, jumlah, petugas pengantar).
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

function getStatusDisplay(p) {
  if (p.statusAdmin === "MENUNGGU_ADMIN") return "Pending";
  if (
    p.statusAdmin === "DITOLAK_ADMIN" &&
    typeof p.catatanAdmin === "string" &&
    p.catatanAdmin.toLowerCase().startsWith("dibatalkan oleh staff")
  ) {
    return "Dibatalkan";
  }
  if (p.statusAdmin === "DITOLAK_ADMIN") return "Ditolak";
  if (p.statusAdmin === "SELESAI") return "Delivered";
  if (p.statusAdmin === "DISETUJUI_ADMIN") {
    if (p.tugasPetugas?.[0]?.petugas) return "On Delivery";
    return "Approved";
  }
  return p.statusAdmin;
}

export default function StaffPermintaan() {
  const [permintaan, setPermintaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailId, setDetailId] = useState(null);

  const fetchPermintaan = async () => {
    setError("");
    try {
      const res = await fetch(apiUrl("/api/permintaan"), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setPermintaan(data.data?.permintaan || []);
      else setError(data.message || "Gagal memuat permintaan");
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPermintaan();
  }, []);

  const filtered = filterStatus
    ? permintaan.filter((p) => {
        if (filterStatus === "ON_DELIVERY")
          return (
            p.statusAdmin === "DISETUJUI_ADMIN" && p.tugasPetugas?.[0]?.petugas
          );
        if (filterStatus === "DISETUJUI_ADMIN")
          return (
            p.statusAdmin === "DISETUJUI_ADMIN" && !p.tugasPetugas?.[0]?.petugas
          );
        return p.statusAdmin === filterStatus;
      })
    : permintaan;

  const detailPermintaan = detailId
    ? permintaan.find((p) => p.id === detailId)
    : null;

  const canBatalkan = (p) => {
    if (!p) return false;
    if (["SELESAI", "DITOLAK_ADMIN"].includes(p.statusAdmin)) return false;
    const tugas = p.tugasPetugas?.[0];
    if (!tugas) return true;
    if (tugas.petugasId) return false;
    if (["ON_DELIVERY", "DALAM_PROSES", "SELESAI", "DELIVERED"].includes(tugas.statusTugas)) return false;
    return true;
  };

  const handleBatalkan = async (permintaanId) => {
    const ok = window.confirm("Yakin ingin membatalkan permintaan ini?");
    if (!ok) return;
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/permintaan/${permintaanId}/batal`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Gagal membatalkan permintaan");
        return;
      }
      await fetchPermintaan();
      if (detailId === permintaanId) setDetailId(null);
    } catch (_) {
      setError("Koneksi gagal.");
    }
  };

  return (
    <main className="app-content">
      <h1>Permintaan Saya</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Riwayat permintaan ATK. Buat permintaan baru dari menu Katalog ATK.
      </p>
      {error && <p className="app-error">{error}</p>}

      {!loading && permintaan.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "0.5rem", color: "#a1a1aa" }}>
            Filter status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "8px",
              background: "#212030",
              border: "1px solid #2a2835",
              color: "#f9f9f9",
            }}
          >
            <option value="">Semua</option>
            <option value="MENUNGGU_ADMIN">Pending</option>
            <option value="DISETUJUI_ADMIN">Approved</option>
            <option value="ON_DELIVERY">On Delivery</option>
            <option value="SELESAI">Delivered</option>
            <option value="DITOLAK_ADMIN">Ditolak</option>
          </select>
        </div>
      )}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : permintaan.length === 0 ? (
        <p className="app-muted">
          Belum ada permintaan. Buat dari Katalog ATK.
        </p>
      ) : filtered.length === 0 ? (
        <p className="app-muted">
          Tidak ada permintaan dengan status tersebut.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Item</th>
                <th>Petugas pengantar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                  <td>
                    <span className={`badge badge-${p.statusAdmin}`}>
                      {getStatusDisplay(p)}
                    </span>
                  </td>
                  <td>
                    {p.items
                      ?.map(
                        (it) =>
                          `${it.barang?.nama} × ${it.jumlah} ${it.barang?.satuan}`,
                      )
                      .join(", ")}
                  </td>
                  <td>{p.tugasPetugas?.[0]?.petugas?.nama ?? "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-sm btn-edit"
                      onClick={() => setDetailId(p.id)}
                    >
                      Detail
                    </button>
                    {canBatalkan(p) && (
                      <button
                        type="button"
                        className="btn-sm btn-danger"
                        style={{ marginLeft: "0.35rem" }}
                        onClick={() => handleBatalkan(p.id)}
                      >
                        Batalkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailPermintaan && (
        <div className="modal-overlay" onClick={() => setDetailId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Detail permintaan</h2>
            <p>
              <strong>Tanggal:</strong>{" "}
              {new Date(detailPermintaan.createdAt).toLocaleString("id-ID")}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`badge badge-${detailPermintaan.statusAdmin}`}>
                {getStatusDisplay(detailPermintaan)}
              </span>
            </p>
            <p>
              <strong>Daftar barang:</strong>
            </p>
            <ul style={{ marginLeft: "1.25rem", marginBottom: "0.75rem" }}>
              {detailPermintaan.items?.map((it) => (
                <li key={it.id}>
                  {it.barang?.nama} × {it.jumlah} {it.barang?.satuan}
                </li>
              ))}
            </ul>
            <p>
              <strong>Petugas pengantar:</strong>{" "}
              {detailPermintaan.tugasPetugas?.[0]?.petugas?.nama ??
                "Belum ditugaskan"}
            </p>
            <p>
              <strong>Lokasi pengantaran:</strong>{" "}
              <span className="app-muted">—</span>
            </p>
            <div className="modal-actions" style={{ marginTop: "1rem" }}>
              {canBatalkan(detailPermintaan) && (
                <button
                  type="button"
                  className="btn-sm btn-danger"
                  onClick={() => handleBatalkan(detailPermintaan.id)}
                >
                  Batalkan Permintaan
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDetailId(null)}
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
