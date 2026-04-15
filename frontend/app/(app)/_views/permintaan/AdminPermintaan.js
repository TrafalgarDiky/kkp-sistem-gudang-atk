"use client";

/** Permintaan — Admin: monitoring status permintaan & pengantaran (tanpa approval manual). */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

function getStatusDisplay(p) {
  if (
    p.statusAdmin === "DITOLAK_ADMIN" &&
    typeof p.catatanAdmin === "string" &&
    p.catatanAdmin.toLowerCase().startsWith("dibatalkan oleh staff")
  ) {
    return p.catatanAdmin;
  }
  if (p.statusAdmin === "DITOLAK_ADMIN") return "Permintaan ditolak";
  if (p.statusAdmin === "SELESAI") return "Selesai";
  if (p.statusAdmin === "DISETUJUI_ADMIN") {
    const tugas = p.tugasPetugas?.[0];
    if (tugas?.petugas) return `Sedang diambil petugas (${tugas.petugas.nama})`;
    return "Menunggu diambil petugas";
  }
  return p.statusAdmin;
}

function getStatusBadgeClass(p) {
  if (p.statusAdmin === "SELESAI") return "SELESAI";
  if (p.statusAdmin === "DISETUJUI_ADMIN") return "DISETUJUI_ADMIN";
  return p.statusAdmin;
}

export default function AdminPermintaan() {
  const [permintaan, setPermintaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalTolakOpen, setModalTolakOpen] = useState(false);
  const [targetTolak, setTargetTolak] = useState(null);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchPermintaan = async () => {
    setError("");
    try {
      const url = filterStatus
        ? apiUrl(`/api/permintaan?status=${encodeURIComponent(filterStatus)}`)
        : apiUrl("/api/permintaan");
      const res = await fetch(url, { headers: getAuthHeaders() });
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
  }, [filterStatus]);

  const openTolak = (p) => {
    setTargetTolak(p);
    setAlasanTolak("");
    setModalTolakOpen(true);
  };

  const closeTolak = () => {
    setModalTolakOpen(false);
    setTargetTolak(null);
    setAlasanTolak("");
  };

  const canTolak = (p) => {
    if (!p) return false;
    if (p.statusAdmin === "SELESAI") return false;
    if (p.statusAdmin === "DITOLAK_ADMIN") return false;
    return true;
  };

  const submitTolak = async (e) => {
    e?.preventDefault();
    if (!targetTolak?.id) return;
    const alasan = (alasanTolak || "").trim();
    if (!alasan) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/permintaan/${targetTolak.id}/approve`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DITOLAK_ADMIN", catatanAdmin: alasan }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        closeTolak();
        fetchPermintaan();
      } else {
        setError(data.message || "Gagal menolak permintaan");
      }
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <main className="app-content">
      <div className="page-head">
        <h1>Permintaan Masuk</h1>
        <p
          className="app-muted"
          style={{ marginTop: "0.25rem", marginBottom: "0.75rem" }}
        >
          Monitoring permintaan ATK dari staff. Permintaan langsung masuk ke
          tugas petugas (tanpa approval manual admin).
        </p>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-select-inline"
          style={{
            padding: "0.4rem 0.75rem",
            borderRadius: "8px",
            background: "#212030",
            border: "1px solid #2a2835",
            color: "#f9f9f9",
          }}
        >
          <option value="">Semua status</option>
          <option value="DISETUJUI_ADMIN">Disetujui</option>
          <option value="DITOLAK_ADMIN">Ditolak / Dibatalkan</option>
          <option value="SELESAI">Selesai</option>
        </select>
      </div>

      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : permintaan.length === 0 ? (
        <p className="app-muted">Tidak ada permintaan.</p>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Peminta</th>
                <th>Divisi</th>
                <th>Item</th>
                <th>Status</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {permintaan.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                  <td>{p.peminta?.nama}</td>
                  <td>{p.peminta?.divisi ?? "-"}</td>
                  <td>
                    {p.items
                      ?.map(
                        (it) =>
                          `${it.barang?.nama} × ${it.jumlah} ${it.barang?.satuan}`,
                      )
                      .join(", ")}
                  </td>
                  <td>
                    <span className={`badge badge-${getStatusBadgeClass(p)}`}>
                      {getStatusDisplay(p)}
                    </span>
                  </td>
                  <td>
                    {p.catatanAdmin || "-"}
                  </td>
                  <td>
                    {canTolak(p) ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => openTolak(p)}
                      >
                        Tolak
                      </button>
                    ) : (
                      <span className="app-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalTolakOpen && targetTolak && (
        <div className="modal-overlay" onClick={closeTolak}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Tolak Permintaan</h2>
            <p className="app-muted" style={{ marginBottom: "0.75rem" }}>
              Permintaan dari <strong>{targetTolak.peminta?.nama ?? "-"}</strong>.
              Alasan akan tercatat sebagai catatan admin.
            </p>

            <form onSubmit={submitTolak}>
              <label>
                Alasan penolakan
                <textarea
                  value={alasanTolak}
                  onChange={(e) => setAlasanTolak(e.target.value)}
                  placeholder="Contoh: stok tidak mencukupi / permintaan tidak sesuai / dsb"
                  style={{ width: "100%", marginTop: "0.25rem", minHeight: 90 }}
                />
              </label>

              <div className="modal-actions" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeTolak}
                  disabled={submitLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Memproses..." : "Tolak Permintaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
