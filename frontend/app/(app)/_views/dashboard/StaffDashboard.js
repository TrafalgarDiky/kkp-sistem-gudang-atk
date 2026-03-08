"use client";

/**
 * Dashboard Staff — ringkasan status permintaan (Pending/Approved/On Delivery/Delivered) + permintaan terbaru.
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import Link from "next/link";

const statusLabel = {
  MENUNGGU_ADMIN: "Menunggu approval",
  DISETUJUI_ADMIN: "Disetujui",
  DITOLAK_ADMIN: "Ditolak",
  SELESAI: "Selesai",
};

function getStatusDisplay(p) {
  if (p.statusAdmin === "MENUNGGU_ADMIN") return "Pending";
  if (p.statusAdmin === "DITOLAK_ADMIN") return "Ditolak";
  if (p.statusAdmin === "SELESAI") return "Delivered";
  if (p.statusAdmin === "DISETUJUI_ADMIN") {
    const tugas = p.tugasPetugas?.[0];
    if (tugas?.petugas) return "On Delivery";
    return "Approved";
  }
  return p.statusAdmin;
}

export default function StaffDashboard({ user }) {
  const [permintaan, setPermintaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(apiUrl("/api/permintaan"), { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPermintaan(data.data?.permintaan || []);
        else setError(data.message || "Gagal memuat");
      })
      .catch(() => setError("Koneksi gagal."))
      .finally(() => setLoading(false));
  }, []);

  const pending = permintaan.filter((p) => p.statusAdmin === "MENUNGGU_ADMIN").length;
  const approved = permintaan.filter(
    (p) => p.statusAdmin === "DISETUJUI_ADMIN" && !p.tugasPetugas?.[0]?.petugasId
  ).length;
  const onDelivery = permintaan.filter(
    (p) => p.statusAdmin === "DISETUJUI_ADMIN" && p.tugasPetugas?.[0]?.petugasId
  ).length;
  const delivered = permintaan.filter((p) => p.statusAdmin === "SELESAI").length;
  const terbaru = [...permintaan].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <main className="app-content">
      <h1>Dashboard Staff</h1>
      {user && (
        <p className="app-muted" style={{ marginBottom: "1rem" }}>
          Halo, <strong>{user.nama}</strong>. Ringkasan permintaan ATK Anda.
        </p>
      )}

      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : (
        <>
          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "#a1a1aa" }}>
              Ringkasan status permintaan
            </h2>
            <div className="dashboard-cards" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <div className="dashboard-card" style={{ minWidth: "120px", padding: "0.75rem 1rem", background: "rgba(251,191,36,0.1)", borderRadius: "8px", border: "1px solid rgba(251,191,36,0.3)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#fbbf24" }}>{pending}</div>
                <div style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>Pending</div>
              </div>
              <div className="dashboard-card" style={{ minWidth: "120px", padding: "0.75rem 1rem", background: "rgba(59,130,246,0.1)", borderRadius: "8px", border: "1px solid rgba(59,130,246,0.3)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#3b82f6" }}>{approved}</div>
                <div style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>Approved</div>
              </div>
              <div className="dashboard-card" style={{ minWidth: "120px", padding: "0.75rem 1rem", background: "rgba(168,85,247,0.1)", borderRadius: "8px", border: "1px solid rgba(168,85,247,0.3)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#a855f7" }}>{onDelivery}</div>
                <div style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>On Delivery</div>
              </div>
              <div className="dashboard-card" style={{ minWidth: "120px", padding: "0.75rem 1rem", background: "rgba(34,197,94,0.1)", borderRadius: "8px", border: "1px solid rgba(34,197,94,0.3)" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#22c55e" }}>{delivered}</div>
                <div style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>Delivered</div>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "#a1a1aa" }}>
              Permintaan terbaru
            </h2>
            {terbaru.length === 0 ? (
              <p className="app-muted">Belum ada permintaan. Buat dari <Link href="/barang" style={{ color: "#8b5cf6" }}>Katalog ATK</Link>.</p>
            ) : (
              <div className="table-wrap">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Item</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terbaru.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                        <td>
                          <span className={`badge badge-${p.statusAdmin}`}>
                            {getStatusDisplay(p)}
                          </span>
                        </td>
                        <td>
                          {p.items?.map((it) => `${it.barang?.nama} × ${it.jumlah}`).join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {permintaan.length > 0 && (
              <p style={{ marginTop: "0.5rem" }}>
                <Link href="/permintaan" className="btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem" }}>
                  Lihat semua permintaan
                </Link>
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
