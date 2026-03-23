"use client";

/**
 * Dashboard Petugas — fokus aksi harian:
 * - Kartu ringkas tugas
 * - Prioritas hari ini
 * - Tugas saya aktif
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export default function PetugasDashboard({ user }) {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchTugas() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(apiUrl("/api/permintaan/tugas"), {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success) setTugas(data.data?.tugas || []);
        else setError(data.message || "Gagal memuat tugas petugas");
      } catch (_) {
        if (!cancelled) setError("Koneksi gagal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTugas();
    return () => {
      cancelled = true;
    };
  }, []);

  const meId = user?.id;

  const summary = useMemo(() => {
    const waiting = tugas.filter(
      (t) =>
        t.statusTugas === "MENUNGGU_ASSIGN" &&
        t.permintaan?.statusAdmin !== "DITOLAK_ADMIN",
    ).length;
    const myActive = tugas.filter(
      (t) =>
        t.petugasId === meId &&
        ["ON_DELIVERY", "DALAM_PROSES", "MENUNGGU_ASSIGN"].includes(
          t.statusTugas,
        ) &&
        t.permintaan?.statusAdmin !== "DITOLAK_ADMIN",
    ).length;
    const doneToday = tugas.filter((t) => {
      if (t.petugasId !== meId) return false;
      if (!["SELESAI", "DELIVERED"].includes(t.statusTugas)) return false;
      const d = new Date(t.updatedAt || t.createdAt);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
    const cancelled = tugas.filter(
      (t) =>
        t.statusTugas === "DITOLAK" ||
        t.permintaan?.statusAdmin === "DITOLAK_ADMIN",
    ).length;
    return { waiting, myActive, doneToday, cancelled };
  }, [tugas, meId]);

  const prioritasHariIni = useMemo(
    () =>
      tugas
        .filter(
          (t) =>
            t.permintaan?.statusAdmin !== "DITOLAK_ADMIN" &&
            ["MENUNGGU_ASSIGN", "ON_DELIVERY", "DALAM_PROSES"].includes(
              t.statusTugas,
            ),
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        .slice(0, 8),
    [tugas],
  );

  const tugasSayaAktif = useMemo(
    () =>
      tugas
        .filter(
          (t) =>
            t.petugasId === meId &&
            ["MENUNGGU_ASSIGN", "ON_DELIVERY", "DALAM_PROSES"].includes(
              t.statusTugas,
            ) &&
            t.permintaan?.statusAdmin !== "DITOLAK_ADMIN",
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
        ),
    [tugas, meId],
  );

  const getStatusLabel = (t) => {
    if (t.statusTugas === "MENUNGGU_ASSIGN") return "Menunggu diambil";
    if (t.statusTugas === "ON_DELIVERY") return "Sedang diantar";
    if (t.statusTugas === "DALAM_PROSES") return "Dalam proses";
    return t.statusTugas;
  };

  const getBarangRingkas = (t) =>
    t.permintaan?.items
      ?.map((it) => it.barang?.nama)
      .filter(Boolean)
      .slice(0, 2)
      .join(", ") || "-";
  const statCards = [
    {
      key: "waiting",
      label: "Menunggu Diambil",
      value: summary.waiting,
      color: "#f59e0b",
      soft: "#fff7ed",
      icon: "fa-solid fa-hourglass-half",
    },
    {
      key: "active",
      label: "Tugas Saya Aktif",
      value: summary.myActive,
      color: "#3b82f6",
      soft: "#eff6ff",
      icon: "fa-solid fa-truck-fast",
    },
    {
      key: "done",
      label: "Selesai Hari Ini",
      value: summary.doneToday,
      color: "#16a34a",
      soft: "#ecfdf5",
      icon: "fa-solid fa-circle-check",
    },
    {
      key: "cancelled",
      label: "Dibatalkan / Ditolak",
      value: summary.cancelled,
      color: "#dc2626",
      soft: "#fef2f2",
      icon: "fa-solid fa-ban",
    },
  ];

  return (
    <main className="app-content">
      <h1>Dashboard Petugas</h1>
      {user && (
        <p className="app-muted" style={{ marginBottom: "1rem" }}>
          Halo, <strong>{user.nama}</strong>. Anda login sebagai <strong>Petugas</strong>.
        </p>
      )}

      {error && <p className="app-error">{error}</p>}

      {/* 4 kartu ringkas */}
      <section style={{ marginBottom: "1.25rem" }}>
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

      {loading ? (
        <p className="app-muted">Memuat data tugas...</p>
      ) : (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>
          {/* Prioritas hari ini */}
          <div>
            <div className="page-head" style={{ marginBottom: "0.5rem" }}>
              <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Prioritas Hari Ini</h2>
              <Link href="/permintaan/tugas" className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}>
                Buka Tugas Aktif
              </Link>
            </div>
            {prioritasHariIni.length === 0 ? (
              <p className="app-muted">Tidak ada tugas prioritas.</p>
            ) : (
              <div className="table-wrap">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Peminta</th>
                      <th>Barang</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prioritasHariIni.map((t) => (
                      <tr key={t.id}>
                        <td>{t.permintaan?.peminta?.nama ?? "-"}</td>
                        <td>{getBarangRingkas(t)}</td>
                        <td>{getStatusLabel(t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tugas saya aktif */}
          <div>
            <div className="page-head" style={{ marginBottom: "0.5rem" }}>
              <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Tugas Saya Aktif</h2>
              <Link href="/permintaan/tugas" className="btn-primary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}>
                Kelola
              </Link>
            </div>
            {tugasSayaAktif.length === 0 ? (
              <p className="app-muted">Belum ada tugas yang kamu ambil.</p>
            ) : (
              <div className="table-wrap">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Staff</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tugasSayaAktif.map((t) => (
                      <tr key={t.id}>
                        <td>{new Date(t.createdAt).toLocaleDateString("id-ID")}</td>
                        <td>{t.permintaan?.peminta?.nama ?? "-"}</td>
                        <td>{getStatusLabel(t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
