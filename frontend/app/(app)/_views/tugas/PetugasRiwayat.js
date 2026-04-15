"use client";

/**
 * Riwayat Tugas — daftar pengantaran yang sudah DELIVERED/SELESAI.
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import Link from "next/link";

export default function PetugasRiwayat() {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(apiUrl("/api/permintaan/tugas"), { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTugas(data.data?.tugas || []);
        else setError(data.message || "Gagal memuat");
      })
      .catch(() => setError("Koneksi gagal."))
      .finally(() => setLoading(false));
  }, []);

  const riwayat = tugas.filter(
    (t) => t.statusTugas === "SELESAI" || t.statusTugas === "DELIVERED"
  ).sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  return (
    <main className="app-content">
      <h1>Riwayat Tugas</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Daftar pengantaran yang sudah selesai (DELIVERED). Kembali ke <Link href="/permintaan/tugas" style={{ color: "#8b5cf6" }}>Tugas Aktif</Link> untuk tugas yang belum selesai.
      </p>
      {error && <p className="app-error">{error}</p>}
      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : riwayat.length === 0 ? (
        <p className="app-muted">Belum ada riwayat pengantaran.</p>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Tanggal pengantaran</th>
                <th>Lokasi pengantaran</th>
                <th>Peminta</th>
                <th>Barang yang diantar</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.updatedAt || t.createdAt).toLocaleString("id-ID")}</td>
                  <td>{t.lokasiTujuan ? t.lokasiTujuan : <span className="app-muted">—</span>}</td>
                  <td>{t.permintaan?.peminta?.nama}</td>
                  <td>
                    {t.permintaan?.items?.map((it) => `${it.barang?.nama} × ${it.jumlah} ${it.barang?.satuan}`).join(", ")}
                  </td>
                  <td>{t.petugas?.nama ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
