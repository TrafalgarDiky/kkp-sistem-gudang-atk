"use client";

/**
 * Layout untuk halaman yang butuh login (dashboard, barang, permintaan, tugas).
 * (app) = route group — URL tetap /dashboard, /barang, dll.
 * Isi: AuthGuard (redirect ke login jika belum login) + Header + children.
 */
import { useEffect, useState } from "react";
import { AuthGuard, Header, Sidebar } from "@/components/layout";
import "../app-layout.css";

export default function AppLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  return (
    <AuthGuard>
      <div className="app-shell">
        <Header user={user} />
        <div className="app-body">
          <Sidebar user={user} />
          <div className="app-main">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
