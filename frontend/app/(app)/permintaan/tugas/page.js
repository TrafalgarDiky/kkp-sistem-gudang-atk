"use client";

/**
 * Halaman Tugas — render view sesuai role (Opsi B).
 * URL: /permintaan/tugas
 * Admin: lihat daftar tugas. Petugas: list + tandai selesai.
 */
import { useEffect, useState } from "react";
import AdminTugas from "../../_views/tugas/AdminTugas";
import PetugasTugas from "../../_views/tugas/PetugasTugas";

export default function TugasPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const role = user?.role || "";

  if (role === "ADMIN") return <AdminTugas />;
  if (role === "PETUGAS") return <PetugasTugas />;

  return (
    <main className="app-content">
      <h1>Tugas Petugas</h1>
      <p>Anda tidak memiliki akses ke halaman ini.</p>
    </main>
  );
}
