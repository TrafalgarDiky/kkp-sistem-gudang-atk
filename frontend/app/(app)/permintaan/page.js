"use client";

/**
 * Halaman Permintaan — render view sesuai role (Opsi B).
 * URL: /permintaan
 * Admin: list + approve. Staff: buat + lihat status.
 */
import { useEffect, useState } from "react";
import AdminPermintaan from "../_views/permintaan/AdminPermintaan";
import StaffPermintaan from "../_views/permintaan/StaffPermintaan";

export default function PermintaanPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const role = user?.role || "";

  if (role === "ADMIN") return <AdminPermintaan />;
  if (role === "STAFF") return <StaffPermintaan />;

  return (
    <main className="app-content">
      <h1>Permintaan</h1>
      <p>Anda tidak memiliki akses ke halaman ini.</p>
    </main>
  );
}
