"use client";

/**
 * Profil — data akun (nama, email, divisi), ganti password, logout.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <main className="app-content">
      <h1>Profil</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Kelola informasi akun dan keamanan.
      </p>
      {user ? (
        <>
          <div className="profil-card">
            <p><strong>Nama</strong><br />{user.nama}</p>
            <p><strong>Email</strong><br />{user.email}</p>
            <p><strong>Divisi</strong><br />{user.divisi ?? "—"}</p>
            <p><strong>Role</strong><br />{user.role}</p>
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {}}
              title="Fitur dalam pengembangan"
            >
              Ganti password
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleLogout}
              style={{ background: "#dc2626" }}
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <p className="app-muted">Memuat...</p>
      )}
    </main>
  );
}
