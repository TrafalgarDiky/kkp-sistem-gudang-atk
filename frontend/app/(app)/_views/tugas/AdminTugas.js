"use client";

/** Tugas — Admin: list tugas (read-only) */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

const statusTugasLabel = { DALAM_PROSES: "Dalam proses", SELESAI: "Selesai" };

export default function AdminTugas() {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setLoading(true);
    fetch(apiUrl("/api/permintaan/tugas"), { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTugas(data.data?.tugas || []);
        else setError(data.message || "Gagal memuat tugas");
      })
      .catch(() => setError("Koneksi gagal."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="app-content">
      <h1>Tugas Petugas (Admin)</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Daftar tugas pengambilan/pengantaran. Petugas yang menandai selesai; stok akan berkurang otomatis.
      </p>
      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : tugas.length === 0 ? (
        <p className="app-muted">Tidak ada tugas.</p>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Peminta</th>
                <th>Item</th>
                <th>Status tugas</th>
              </tr>
            </thead>
            <tbody>
              {tugas.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.permintaan?.createdAt).toLocaleDateString("id-ID")}</td>
                  <td>{t.permintaan?.peminta?.nama}</td>
                  <td>
                    {t.permintaan?.items?.map((it) => `${it.barang?.nama} × ${it.jumlah} ${it.barang?.satuan}`).join(", ")}
                  </td>
                  <td>
                    <span className={`badge badge-${t.statusTugas}`}>
                      {statusTugasLabel[t.statusTugas] || t.statusTugas}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
