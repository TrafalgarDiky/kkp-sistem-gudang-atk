"use client";

/**
 * Halaman Dashboard — render view sesuai role (Opsi B).
 * URL: /dashboard
 */
import { useEffect, useState } from "react";
import AdminDashboard from "../_views/dashboard/AdminDashboard";
import StaffDashboard from "../_views/dashboard/StaffDashboard";
import PetugasDashboard from "../_views/dashboard/PetugasDashboard";

export default function DashboardPage() {
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

  if (role === "ADMIN") return <AdminDashboard user={user} />;
  if (role === "STAFF") return <StaffDashboard user={user} />;
  if (role === "PETUGAS") return <PetugasDashboard user={user} />;

  return (
    <main className="app-content">
      <h1>Dashboard</h1>
      {user && <p>Halo, <strong>{user.nama}</strong>. Role: {role || "-"}.</p>}
    </main>
  );
}
