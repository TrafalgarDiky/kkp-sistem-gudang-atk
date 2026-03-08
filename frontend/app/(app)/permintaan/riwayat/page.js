"use client";

/**
 * Riwayat Tugas — Petugas: daftar pengantaran yang sudah DELIVERED/SELESAI.
 * URL: /permintaan/riwayat
 */
import { useEffect, useState } from "react";
import PetugasRiwayat from "../../_views/tugas/PetugasRiwayat";

export default function RiwayatTugasPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  if (user?.role !== "PETUGAS") {
    return (
      <main className="app-content">
        <h1>Riwayat Tugas</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  return <PetugasRiwayat />;
}
