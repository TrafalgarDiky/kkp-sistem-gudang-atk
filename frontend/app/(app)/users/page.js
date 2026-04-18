"use client";

/**
 * Manajemen User — Admin.
 * - Daftar semua user
 * - Verifikasi user baru (BELUM_VERIFIKASI)
 * - Ubah role & status via modal
 * - Self-guard: admin tidak bisa menonaktifkan / ubah role akunnya sendiri.
 *
 * Endpoints:
 *   GET   /api/auth/users
 *   PATCH /api/auth/users/:id          (body: { role?, statusAkun? })
 *   PATCH /api/auth/users/:id/verify   (body: { status: "AKTIF" | "DITOLAK" })
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { UserCell } from "@/components/ui";

// ====================== Helpers ======================

const labelRole = (r) =>
  ({ ADMIN: "Admin", STAFF: "Staff", PETUGAS: "Petugas" })[r] || r;

const labelStatus = (s) =>
  ({ AKTIF: "Aktif", DITOLAK: "Nonaktif", BELUM_VERIFIKASI: "Belum verifikasi" })[s] || s;

/** Mapping role -> pill variant (warna) */
const roleVariant = (r) => (r === "ADMIN" ? "info" : "muted");

/** Mapping status akun -> pill variant */
const statusVariant = (s) => {
  if (s === "AKTIF") return "success";
  if (s === "BELUM_VERIFIKASI") return "warning";
  if (s === "DITOLAK") return "danger";
  return "muted";
};

// ====================== Page ======================

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role: "", statusAkun: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Loading per-row untuk aksi Verifikasi / Nonaktif / Aktifkan
  const [rowLoadingId, setRowLoadingId] = useState(null);

  // Ambil user yang sedang login dari localStorage
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try { setCurrentUser(JSON.parse(raw)); } catch (_) {}
    }
  }, []);

  // ====================== Fetch ======================

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/auth/users"), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setUsers(data.data?.users || []);
      else setError(data.message || "Gagal memuat user");
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role !== "ADMIN") return;
    fetchUsers();
  }, [currentUser?.role]);

  // ====================== Handlers ======================

  const openEdit = (u) => {
    setEditing(u);
    setForm({ role: u.role, statusAkun: u.statusAkun });
    setModalError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setModalOpen(false);
    setEditing(null);
    setModalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing?.id) return;

    // Self-guard di modal juga: jangan sampai admin ubah role/status diri sendiri
    const isSelf = editing.id === currentUser?.id;
    if (isSelf && (form.role !== editing.role || form.statusAkun !== editing.statusAkun)) {
      setModalError("Anda tidak dapat mengubah role atau status akun sendiri.");
      return;
    }

    setSubmitLoading(true);
    setModalError("");
    try {
      const body = {};
      if (form.role !== editing.role) body.role = form.role;
      if (form.statusAkun !== editing.statusAkun) body.statusAkun = form.statusAkun;
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
        setModalError(data.message || "Gagal update user");
      }
    } catch (_) {
      setModalError("Koneksi gagal.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVerify = async (u, status) => {
    if (!u?.id) return;
    setRowLoadingId(u.id);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/auth/users/${u.id}/verify`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
      else setError(data.message || "Gagal verifikasi");
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setRowLoadingId(null);
    }
  };

  const handleToggleAktif = async (u) => {
    if (!u?.id) return;
    const nextStatus = u.statusAkun === "AKTIF" ? "DITOLAK" : "AKTIF";
    const verb = nextStatus === "DITOLAK" ? "nonaktifkan" : "aktifkan kembali";
    const ok = window.confirm(`Yakin ${verb} user "${u.nama}"?`);
    if (!ok) return;

    setRowLoadingId(u.id);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/auth/users/${u.id}`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ statusAkun: nextStatus }),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
      else setError(data.message || `Gagal ${verb} user`);
    } catch (_) {
      setError("Koneksi gagal.");
    } finally {
      setRowLoadingId(null);
    }
  };

  // ====================== Guards ======================

  if (currentUser && currentUser.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Manajemen User</h1>
        <p className="app-muted">Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  // ====================== Render ======================

  return (
    <main className="app-content">
      <h1>Manajemen User</h1>
      <p className="app-muted" style={{ marginBottom: "1rem", fontSize: "0.88rem" }}>
        Verifikasi user baru, ubah role, dan nonaktifkan akun.
      </p>

      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat...</p>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-users" />
          <div className="empty-state-title">Belum ada user</div>
          <p className="empty-state-sub">User akan muncul setelah ada yang registrasi.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th style={{ width: 150 }}>Divisi</th>
                <th style={{ width: 110 }}>Role</th>
                <th style={{ width: 150 }}>Status</th>
                <th style={{ width: 180, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isRowLoading = rowLoadingId === u.id;

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <UserCell name={u.nama} />
                        {isSelf && (
                          <span className="pill pill-info" style={{ fontSize: "0.68rem" }}>
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {u.divisi ? (
                        <span>
                          <i className="fa-solid fa-building app-muted" style={{ marginRight: 6, fontSize: "0.78rem" }} />
                          {u.divisi}
                        </span>
                      ) : (
                        <span className="app-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`pill pill-${roleVariant(u.role)}`}>
                        {labelRole(u.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`pill pill-${statusVariant(u.statusAkun)}`}>
                        {labelStatus(u.statusAkun)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="row-actions">
                        {/* Verifikasi: hanya untuk BELUM_VERIFIKASI */}
                        {u.statusAkun === "BELUM_VERIFIKASI" && (
                          <>
                            <button
                              type="button"
                              className="icon-btn icon-btn-edit"
                              onClick={() => handleVerify(u, "AKTIF")}
                              disabled={isRowLoading}
                              title="Setujui user"
                            >
                              <i className="fa-solid fa-check" />
                            </button>
                            <button
                              type="button"
                              className="icon-btn icon-btn-danger"
                              onClick={() => handleVerify(u, "DITOLAK")}
                              disabled={isRowLoading}
                              title="Tolak user"
                            >
                              <i className="fa-solid fa-xmark" />
                            </button>
                          </>
                        )}

                        {/* Toggle aktif/nonaktif: untuk AKTIF atau DITOLAK, BUKAN diri sendiri */}
                        {u.statusAkun !== "BELUM_VERIFIKASI" && (
                          <button
                            type="button"
                            className={`icon-btn ${u.statusAkun === "AKTIF" ? "icon-btn-danger" : "icon-btn-edit"}`}
                            onClick={() => handleToggleAktif(u)}
                            disabled={isSelf || isRowLoading}
                            title={
                              isSelf
                                ? "Tidak dapat menonaktifkan akun sendiri"
                                : u.statusAkun === "AKTIF"
                                ? "Nonaktifkan user"
                                : "Aktifkan kembali user"
                            }
                          >
                            <i className={`fa-solid ${u.statusAkun === "AKTIF" ? "fa-user-slash" : "fa-user-check"}`} />
                          </button>
                        )}

                        {/* Edit selalu ada (untuk self pun boleh buka, tapi submit akan di-guard) */}
                        <button
                          type="button"
                          className="icon-btn icon-btn-edit"
                          onClick={() => openEdit(u)}
                          disabled={isRowLoading}
                          title="Edit role & status"
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ MODAL: EDIT USER ============ */}
      {modalOpen && editing && (() => {
        const isSelf = editing.id === currentUser?.id;
        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit User</h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeModal}
                  disabled={submitLoading}
                  title="Tutup"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <p className="modal-subtitle">
                <strong>{editing.nama}</strong> · {editing.email}
              </p>
              <div className="modal-divider" />

              <form onSubmit={handleSubmit}>
                <label>Role <span className="required">*</span></label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  disabled={isSelf}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="PETUGAS">Petugas</option>
                </select>

                <label>Status Akun <span className="required">*</span></label>
                <select
                  value={form.statusAkun}
                  onChange={(e) => setForm((f) => ({ ...f, statusAkun: e.target.value }))}
                  disabled={isSelf}
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="DITOLAK">Nonaktif</option>
                  <option value="BELUM_VERIFIKASI">Belum verifikasi</option>
                </select>

                {isSelf && (
                  <div className="form-error" style={{ background: "#fff7ed", borderColor: "#fed7aa", color: "#b45309" }}>
                    <i className="fa-solid fa-shield-halved" />
                    <span>Ini akun Anda sendiri — role dan status terkunci untuk mencegah kunci-diri.</span>
                  </div>
                )}

                {modalError && (
                  <div className="form-error">
                    <i className="fa-solid fa-circle-exclamation" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="modal-actions-block">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                    disabled={submitLoading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitLoading || isSelf}
                  >
                    {submitLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
