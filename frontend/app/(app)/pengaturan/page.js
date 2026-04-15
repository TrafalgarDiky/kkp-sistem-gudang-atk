"use client";

/**
 * Pengaturan (Admin)
 * URL: /pengaturan
 *
 * Apa tujuan bagian ini?
 * - Menyediakan menu "Pengaturan" sesuai sidebar, tanpa menghapus fitur Profil yang sudah ada.
 *
 * Apa input?
 * - Data user dari localStorage.
 *
 * Apa output?
 * - Halaman pengaturan sederhana yang menampilkan info akun (reuse konsep profil).
 *
 * Kenapa pakai cara ini?
 * - Supaya link "Pengaturan" tidak 404, dan nanti bisa dikembangkan (ganti password, preferensi, dsb).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export default function PengaturanPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ nama: "", email: "", divisi: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setUser(u);
        setForm({
          nama: u?.nama ?? "",
          email: u?.email ?? "",
          divisi: u?.divisi ?? "",
        });
      } catch (_) {}
    }
  }, []);

  // Pengaturan bisa dipakai semua role (admin/staff/petugas) untuk ubah profil + logout.

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const payload = {
      nama: form.nama.trim(),
      email: form.email.trim(),
      divisi: form.divisi.trim(),
    };

    if (!payload.nama) {
      setMessage({ type: "error", text: "Nama wajib diisi." });
      return;
    }
    if (!payload.email || !payload.email.includes("@")) {
      setMessage({ type: "error", text: "Email tidak valid." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/me"), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.success) {
        setMessage({ type: "error", text: json.message || "Gagal update profil." });
        return;
      }
      const updated = json.data?.user;
      setUser(updated);
      if (typeof window !== "undefined" && updated) {
        localStorage.setItem("user", JSON.stringify(updated));
      }
      setMessage({ type: "success", text: "Profil berhasil diupdate." });
    } catch (_) {
      setMessage({ type: "error", text: "Koneksi gagal. Pastikan backend hidup." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-content">
      <h1>Pengaturan</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Kelola profil akun dan logout.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(220px, 280px)", gap: "1rem", alignItems: "start" }}>
        {/* Kiri: Ubah Profil */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>Ubah Profil</h2>

          {message.text && (
            <p style={{ color: message.type === "error" ? "var(--danger)" : "var(--success)", marginBottom: "0.75rem" }}>
              {message.text}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              Nama
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem" }}
                required
              />
            </label>

            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem" }}
                required
              />
            </label>

            <label style={{ display: "block", marginBottom: "0.75rem" }}>
              Divisi
              <input
                type="text"
                value={form.divisi}
                onChange={(e) => setForm((f) => ({ ...f, divisi: e.target.value }))}
                style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem" }}
                placeholder="Contoh: Umum, Keuangan, Gudang"
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </form>

          <p className="app-muted" style={{ marginTop: "0.75rem" }}>
            Yang bisa diubah hanya: <strong>nama</strong>, <strong>email</strong>, dan <strong>divisi</strong>.
          </p>
        </section>

        {/* Kanan: Logout */}
        <aside style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>Logout</h2>
          <p className="app-muted" style={{ marginBottom: "0.75rem" }}>
            Keluar dari akun ini di perangkat kamu.
          </p>
          <button type="button" className="btn btn-danger" onClick={handleLogout} style={{ width: "100%" }}>
            Logout
          </button>
        </aside>
      </div>
    </main>
  );
}

