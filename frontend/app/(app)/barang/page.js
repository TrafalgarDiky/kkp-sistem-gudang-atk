"use client";

/**
 * Halaman Barang — render view sesuai role (Opsi B).
 * URL: /barang
 * Admin: tabel + CRUD. Staff & Petugas: card (toko online).
 */
import { useEffect, useState } from "react";
import AdminBarang from "../_views/barang/AdminBarang";
import StaffBarang from "../_views/barang/StaffBarang";

export default function BarangPage() {
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

  if (role === "ADMIN") return <AdminBarang />;
  return <StaffBarang />;
}
