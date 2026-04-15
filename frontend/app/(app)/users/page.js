"use client";

/**
 * User & Role — Admin: daftar user, verifikasi (pending), ubah role & status.
 * GET /api/auth/users, PATCH /api/auth/users/:id (role, statusAkun), PATCH /api/auth/users/:id/verify
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export default function UsersPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role: "", statusAkun: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/auth/users"), {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setUsers(data.data?.users || []);
      else setError(data.message || "Gagal memuat user");
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchUsers();
  }, [user?.role]);

  const openEdit = (u) => {
    setEditing(u);
    setForm({ role: u.role, statusAkun: u.statusAkun });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing?.id) return;
    setSubmitLoading(true);
    setError("");
    try {
      const body = {};
      if (form.role !== editing.role) body.role = form.role;
      if (form.statusAkun !== editing.statusAkun)
        body.statusAkun = form.statusAkun;
      if (Object.keys(body).length === 0) {
        closeModal();
        setSubmitLoading(false);
        return;
      }
      const res = await fetch(apiUrl(`/api/auth/users/${editing.id}`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        closeModal();
      } else {
        setError(data.message || "Gagal update user");
      }
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVerify = async (userId, status) => {
    try {
      const res = await fetch(apiUrl(`/api/auth/users/${userId}/verify`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
      else setError(data.message || "Gagal verifikasi");
    } catch (err) {
      setError("Koneksi gagal.");
    }
  };

  const handleNonaktifkan = async (u) => {
    if (!u?.id) return;
    const ok = window.confirm(`Nonaktifkan user "${u.nama}"? User tidak bisa login.`);
    if (!ok) return;
    setConfirmLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/auth/users/${u.id}`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ statusAkun: "DITOLAK" }),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
      else setError(data.message || "Gagal menonaktifkan user");
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleAktifkan = async (u) => {
    if (!u?.id) return;
    const ok = window.confirm(`Aktifkan kembali user "${u.nama}"?`);
    if (!ok) return;
    setConfirmLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/auth/users/${u.id}`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ statusAkun: "AKTIF" }),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
      else setError(data.message || "Gagal mengaktifkan user");
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setConfirmLoading(false);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>User & Role</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  const labelStatus = (s) =>
    ({
      AKTIF: "Aktif",
      DITOLAK: "Nonaktif",
      BELUM_VERIFIKASI: "Belum verifikasi",
    })[s] || s;
  const labelRole = (r) =>
    ({ ADMIN: "Admin", STAFF: "Staff", PETUGAS: "Petugas" })[r] || r;

  return (
    <main className="app-content">
      <h1>Manajemen User</h1>
      <p className="app-muted" style={{ marginBottom: "1rem" }}>
        Kelola akun: verifikasi user baru, ubah role (assign role), dan nonaktifkan akun.
      </p>

      {error && (
        <p style={{ color: "var(--danger)", marginBottom: "0.5rem" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            className="app-table"
            style={{ width: "100%", fontSize: "0.9rem" }}
          >
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="app-muted">
                    Belum ada user.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nama}</td>
                    <td>{u.email}</td>
                    <td>{labelRole(u.role)}</td>
                    <td>{labelStatus(u.statusAkun)}</td>
                    <td>
                      {u.statusAkun === "BELUM_VERIFIKASI" && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ marginRight: "0.5rem" }}
                            onClick={() => handleVerify(u.id, "AKTIF")}
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleVerify(u.id, "DITOLAK")}
                          >
                            Tolak
                          </button>{" "}
                        </>
                      )}
                      {u.statusAkun === "AKTIF" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          style={{ marginRight: "0.5rem" }}
                          onClick={() => handleNonaktifkan(u)}
                          disabled={confirmLoading}
                          title="Set status akun menjadi Nonaktif (tidak bisa login)"
                        >
                          {confirmLoading ? "..." : "Nonaktifkan"}
                        </button>
                      )}
                      {u.statusAkun === "DITOLAK" && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ marginRight: "0.5rem" }}
                          onClick={() => handleAktifkan(u)}
                          disabled={confirmLoading}
                          title="Aktifkan kembali (bisa login)"
                        >
                          {confirmLoading ? "..." : "Aktifkan"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEdit(u)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && editing && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            className="modal-content"
            style={{
              background: "var(--bg)",
              padding: "1.5rem",
              borderRadius: "8px",
              minWidth: "320px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "1rem" }}>Edit User: {editing.nama}</h3>
            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", marginBottom: "0.75rem" }}>
                Role
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="PETUGAS">Petugas</option>
                </select>
              </label>
              <label style={{ display: "block", marginBottom: "0.75rem" }}>
                Status Akun
                <select
                  value={form.statusAkun}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, statusAkun: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="DITOLAK">Ditolak</option>
                  <option value="BELUM_VERIFIKASI">Belum verifikasi</option>
                </select>
              </label>
              <div
                style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
