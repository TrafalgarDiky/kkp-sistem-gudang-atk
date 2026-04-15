"use client";

/**
 * Export Pengeluaran (Admin)
 * URL: /pengeluaran/export
 *
 * Apa tujuan bagian ini?
 * - Menjadi tempat tombol export PDF / Excel / spreadsheet untuk pengeluaran.
 *
 * Apa input?
 * - Role user dari localStorage.
 *
 * Apa output?
 * - Placeholder UI (belum ada proses export).
 *
 * Kenapa pakai cara ini?
 * - Supaya menu sidebar tidak 404 dulu, dan nanti kita tinggal isi implementasi export.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PengeluaranExportPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  if (user && user.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Export Pengeluaran</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  return (
    <main className="app-content">
      <h1>Export Pengeluaran</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Format yang direncanakan: PDF, Excel, dan spreadsheet (CSV).
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button className="btn btn-secondary" type="button" disabled>Export PDF</button>
        <button className="btn btn-secondary" type="button" disabled>Export Excel</button>
        <button className="btn btn-secondary" type="button" disabled>Export CSV</button>
      </div>

      <p className="app-muted">
        Implementasi export akan kita sambungkan ke endpoint backend (misalnya: generate file dan download).
      </p>

      <div style={{ marginTop: "1rem" }}>
        <Link href="/pengeluaran" className="btn btn-primary">Kembali ke Pengeluaran</Link>
      </div>
    </main>
  );
}

