"use client";

/**
 * Dashboard Staff — ringkasan status permintaan (Pending/Approved/On Delivery/Delivered) + permintaan terbaru.
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import Link from "next/link";

function getStatusDisplay(p) {
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

  const waitingPickup = permintaan.filter(
    (p) => p.statusAdmin === "DISETUJUI_ADMIN" && !p.tugasPetugas?.[0]?.petugasId,
  ).length;
  const approved = permintaan.filter(
    (p) => p.statusAdmin === "DISETUJUI_ADMIN"
  ).length;
  const onDelivery = permintaan.filter(
    (p) => p.statusAdmin === "DISETUJUI_ADMIN" && p.tugasPetugas?.[0]?.petugasId,
  ).length;
  const delivered = permintaan.filter((p) => p.statusAdmin === "SELESAI").length;
  const cancelled = permintaan.filter((p) => p.statusAdmin === "DITOLAK_ADMIN").length;
  const terbaru = [...permintaan].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ).slice(0, 5);
  const statCards = [
    {
      key: "waiting",
      label: "Menunggu Diambil",
      value: waitingPickup,
      color: "#f59e0b",
      soft: "#fff7ed",
      icon: "fa-solid fa-hourglass-half",
    },
    {
      key: "approved",
      label: "Total Disetujui",
      value: approved,
      color: "#3b82f6",
      soft: "#eff6ff",
      icon: "fa-solid fa-clipboard-check",
    },
    {
      key: "delivery",
      label: "On Delivery",
      value: onDelivery,
      color: "#8b5cf6",
      soft: "#f5f3ff",
      icon: "fa-solid fa-truck-fast",
    },
    {
      key: "delivered",
      label: "Delivered",
      value: delivered,
      color: "#22c55e",
      soft: "#ecfdf5",
      icon: "fa-solid fa-circle-check",
    },
  ];

  return (
    <main className="app-content">
      <h1>Dashboard Staff</h1>
      {user && (
        <p className="app-muted" style={{ marginBottom: "1rem" }}>
          Halo, <strong>{user.nama}</strong>. Ringkasan permintaan ATK Anda hari ini.
        </p>
      )}

      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : (
        <>
          <section style={{ marginBottom: "1.5rem" }}>
            <div className="stats-grid">
              {statCards.map((card) => (
                <div
                  key={card.key}
                  className="stats-card"
                  style={{ "--accent": card.color, "--accent-soft": card.soft }}
                >
                  <div className="stats-card-head">
                    <span className="stats-icon">
                      <i className={card.icon} />
                    </span>
                    <div className="stats-value">{card.value}</div>
                  </div>
                  <div className="stats-label">{card.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <div className="page-head" style={{ marginBottom: "0.45rem" }}>
                <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Riwayat Terbaru</h2>
                <Link href="/barang" className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}>
                  Buat Permintaan
                </Link>
              </div>
              {terbaru.length === 0 ? (
                <p className="app-muted">
                  Belum ada permintaan. Buat dari{" "}
                  <Link href="/barang" style={{ color: "#8b5cf6" }}>
                    Katalog ATK
                  </Link>
                  .
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terbaru.map((p) => (
                        <tr key={p.id}>
                          <td>{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                          <td>
                            <span className={`badge badge-${p.statusAdmin}`}>{getStatusDisplay(p)}</span>
                          </td>
                          <td>
                            <span className="app-muted">{p.items?.length || 0} item</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="app-muted" style={{ marginTop: "0.55rem", fontSize: "0.85rem" }}>
                Dibatalkan/ditolak: <strong>{cancelled}</strong>
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
