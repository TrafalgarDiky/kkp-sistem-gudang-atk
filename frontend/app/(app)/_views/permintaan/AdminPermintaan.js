"use client";

/** Permintaan — Admin: hanya Setujui/Tolak. Status setelah disetujui: Menunggu diambil petugas / Sedang diambil petugas / Selesai. */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

const statusLabel = {
  MENUNGGU_ADMIN: "Menunggu approval",
  DISETUJUI_ADMIN: "Disetujui",
  DITOLAK_ADMIN: "Permintaan ditolak",
  SELESAI: "Selesai",
};

function getStatusDisplay(p) {
  if (p.statusAdmin === "MENUNGGU_ADMIN") return "Menunggu approval";
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
  const [approvingId, setApprovingId] = useState(null);
  const [approveStatus, setApproveStatus] = useState("DISETUJUI_ADMIN");
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");

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

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approvingId) return;
    setSubmitLoading(true);
    setError("");
    setModalError("");
    try {
      const res = await fetch(apiUrl(`/api/permintaan/${approvingId}/approve`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: approveStatus, catatanAdmin: catatanAdmin.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setApprovingId(null);
        setCatatanAdmin("");
        setModalError("");
        fetchPermintaan();
      } else {
        const msg = data.message || "Gagal memproses";
        setModalError(msg);
        setError(msg);
      }
    } catch (err) {
      const msg = "Koneksi gagal. Periksa backend dan jaringan.";
      setModalError(msg);
      setError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <main className="app-content">
      <div className="page-head">
        <h1>Permintaan Masuk (Approval)</h1>
        <p className="app-muted" style={{ marginTop: "0.25rem", marginBottom: "0.75rem" }}>
          Periksa dan setujui/tolak permintaan ATK. Setelah disetujui, status akan berubah: Menunggu diambil petugas → Sedang diambil petugas → Selesai.
        </p>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-select-inline"
          style={{ padding: "0.4rem 0.75rem", borderRadius: "8px", background: "#212030", border: "1px solid #2a2835", color: "#f9f9f9" }}
        >
          <option value="">Semua status</option>
          <option value="MENUNGGU_ADMIN">Menunggu approval</option>
          <option value="DISETUJUI_ADMIN">Disetujui</option>
          <option value="DITOLAK_ADMIN">Ditolak</option>
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
                <th>Item</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {permintaan.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                  <td>{p.peminta?.nama}</td>
                  <td>
                    {p.items?.map((it) => `${it.barang?.nama} × ${it.jumlah} ${it.barang?.satuan}`).join(", ")}
                  </td>
                  <td>
                    <span className={`badge badge-${getStatusBadgeClass(p)}`}>
                      {getStatusDisplay(p)}
                    </span>
                  </td>
                  <td>
                    {p.statusAdmin === "MENUNGGU_ADMIN" && (
                      <>
                        <button
                          type="button"
                          className="btn-sm btn-edit"
                          onClick={() => {
                            setApprovingId(p.id);
                            setApproveStatus("DISETUJUI_ADMIN");
                            setCatatanAdmin("");
                            setModalError("");
                          }}
                        >
                          Setujui
                        </button>
                        <button
                          type="button"
                          className="btn-sm btn-danger"
                          style={{ marginLeft: "0.35rem" }}
                          onClick={() => {
                            setApprovingId(p.id);
                            setApproveStatus("DITOLAK_ADMIN");
                            setCatatanAdmin("");
                            setModalError("");
                          }}
                        >
                          Tolak
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approvingId && (
        <div className="modal-overlay" onClick={() => setApprovingId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>{approveStatus === "DISETUJUI_ADMIN" ? "Setujui permintaan" : "Tolak permintaan"}</h2>
            <form onSubmit={handleApprove}>
              {modalError && <p className="app-error" style={{ marginBottom: "0.75rem" }}>{modalError}</p>}
              <label>Catatan (opsional)</label>
              <input
                type="text"
                value={catatanAdmin}
                onChange={(e) => setCatatanAdmin(e.target.value)}
                placeholder="Catatan untuk peminta"
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setApprovingId(null)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={submitLoading}>
                  {submitLoading ? "Memproses..." : approveStatus === "DISETUJUI_ADMIN" ? "Setujui" : "Tolak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
