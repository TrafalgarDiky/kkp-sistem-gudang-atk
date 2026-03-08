"use client";

/**
 * Notifikasi — Staff: update status permintaan (disetujui/ditolak/sedang diantar/sudah diterima).
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import Link from "next/link";

function getNotifMessage(p) {
  if (p.statusAdmin === "MENUNGGU_ADMIN") return "Permintaan menunggu persetujuan.";
  if (p.statusAdmin === "DITOLAK_ADMIN") return "Permintaan ditolak.";
  if (p.statusAdmin === "SELESAI") return "Barang sudah diterima.";
  if (p.statusAdmin === "DISETUJUI_ADMIN") {
    if (p.tugasPetugas?.[0]?.petugas)
      return `Barang sedang diantar oleh ${p.tugasPetugas[0].petugas.nama}.`;
    return "Permintaan disetujui.";
  }
  return p.statusAdmin;
}

function getNotifIcon(p) {
  if (p.statusAdmin === "DITOLAK_ADMIN") return "fa-circle-xmark";
  if (p.statusAdmin === "SELESAI") return "fa-circle-check";
  if (p.statusAdmin === "DISETUJUI_ADMIN" && p.tugasPetugas?.[0]?.petugas) return "fa-truck";
  return "fa-circle-info";
}

export default function NotifikasiPage() {
  const [user, setUser] = useState(null);
  const [permintaan, setPermintaan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "STAFF") return;
    setLoading(true);
    fetch(apiUrl("/api/permintaan"), { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPermintaan(data.data?.permintaan || []);
        else setError(data.message || "Gagal memuat");
      })
      .catch(() => setError("Koneksi gagal."))
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (user?.role !== "STAFF") {
    return (
      <main className="app-content">
        <h1>Notifikasi</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  const sorted = [...permintaan].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );

  return (
    <main className="app-content">
      <h1>Notifikasi</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Update status permintaan: disetujui, ditolak, sedang diantar, sudah diterima.
      </p>
      {error && <p className="app-error">{error}</p>}
      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : sorted.length === 0 ? (
        <p className="app-muted">Belum ada notifikasi.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.map((p) => (
            <li
              key={p.id}
              style={{
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                border: "1px solid #2a2835",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <i className={`fa-solid ${getNotifIcon(p)}`} style={{ color: "#8b5cf6", marginTop: "0.2rem" }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, marginBottom: "0.25rem" }}>{getNotifMessage(p)}</p>
                <p className="app-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                  {p.items?.map((it) => `${it.barang?.nama} × ${it.jumlah}`).join(", ")} —{" "}
                  {new Date(p.updatedAt || p.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <Link href="/permintaan" className="btn-sm btn-edit" style={{ flexShrink: 0 }}>
                Lihat
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
