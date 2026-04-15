"use client";

/**
 * Form Minta Barang (Admin)
 * URL: /permintaan/buat
 *
 * Apa tujuan bagian ini?
 * - Memberi halaman khusus untuk admin agar bisa request barang seperti staff.
 *
 * Apa input?
 * - Data user dari localStorage (untuk cek role).
 *
 * Apa output?
 * - Tampilan katalog barang + modal minta barang (reuse komponen katalog staff).
 *
 * Kenapa pakai cara ini?
 * - Fitur "form berbentuk katalog" sudah ada di `StaffBarang`, jadi kita pakai ulang
 *   biar konsisten dan lebih cepat.
 */

import { useEffect, useState } from "react";
import StaffBarang from "../../_views/barang/StaffBarang";

export default function PermintaanBuatPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  // Admin saja. (Kalau kamu mau STAFF juga boleh akses halaman ini, nanti kita longgarkan.)
  if (user && user.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Form Minta Barang</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  // Reuse UI katalog dari staff (sudah ada: cari/filter + modal + POST /api/permintaan)
  return <StaffBarang />;
}

