"use client";

/**
 * Halaman Profil — untuk user yang sedang login.
 * 3 section:
 *  1. Info Saya (read-only)
 *  2. Ubah Data Diri (nama, email, divisi)
 *  3. Ubah Password (password lama + baru + konfirmasi)
 *
 * Endpoint:
 *   GET   /api/auth/me
 *   PATCH /api/auth/me            (nama/email/divisi)
 *   PATCH /api/auth/me/password   (passwordLama, passwordBaru)
 */
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { UserCell } from "@/components/ui";

// ====================== Helpers ======================

function labelRole(r) {
  return ({ ADMIN: "Admin", STAFF: "Staff", PETUGAS: "Petugas" })[r] || r;
}
function labelStatus(s) {
  return ({ AKTIF: "Aktif", DITOLAK: "Nonaktif", BELUM_VERIFIKASI: "Belum verifikasi" })[s] || s;
}
function roleVariant(r) {
  return r === "ADMIN" ? "info" : "muted";
}
function statusVariant(s) {
  if (s === "AKTIF") return "success";
  if (s === "BELUM_VERIFIKASI") return "warning";
  if (s === "DITOLAK") return "danger";
  return "muted";
}

function toIdDate(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

// ====================== Page ======================

export default function ProfilPage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Form: Ubah Data Diri
  const [profileForm, setProfileForm] = useState({ nama: "", email: "", divisi: "" });
  const [profileSubmit, setProfileSubmit] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Form: Ubah Password
  const [pwForm, setPwForm] = useState({ passwordLama: "", passwordBaru: "", konfirmasi: "" });
  const [pwSubmit, setPwSubmit] = useState(false);
  const [pwError, setPwError] = useState("");

  // Toast
  const [toast, setToast] = useState(null);

  // ====================== Fetch ======================

  const fetchMe = async () => {
    setLoadError("");
    try {
      const res = await fetch(apiUrl("/api/auth/me"), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        const u = data.data?.user || null;
        setMe(u);
        if (u) {
          setProfileForm({
            nama: u.nama || "",
            email: u.email || "",
            divisi: u.divisi || "",
          });
        }
      } else {
        setLoadError(data.message || "Gagal memuat profil");
      }
    } catch (_) {
      setLoadError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ====================== Handlers ======================

  /** Submit: update nama/email/divisi */
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!me) return;

    // Bandingkan dengan data awal, hanya kirim field yang berubah
    const body = {};
    if (profileForm.nama !== (me.nama || "")) body.nama = profileForm.nama.trim();
    if (profileForm.email !== (me.email || "")) body.email = profileForm.email.trim();
    if ((profileForm.divisi || "") !== (me.divisi || "")) body.divisi = profileForm.divisi.trim();

    if (Object.keys(body).length === 0) {
      setProfileError("Tidak ada perubahan untuk disimpan.");
      return;
    }

    setProfileSubmit(true);
    setProfileError("");
    try {
      const res = await fetch(apiUrl("/api/auth/me"), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMe(data.data?.user || me);
        // Sync juga ke localStorage supaya sidebar/header ikut terupdate
        try {
          const raw = localStorage.getItem("user");
          if (raw) {
            const u = JSON.parse(raw);
            const updated = { ...u, ...(data.data?.user || {}) };
            localStorage.setItem("user", JSON.stringify(updated));
          }
        } catch (_) {}
        setToast({ variant: "success", message: "Profil berhasil diupdate." });
      } else {
        setProfileError(data.message || "Gagal update profil");
      }
    } catch (_) {
      setProfileError("Koneksi gagal.");
    } finally {
      setProfileSubmit(false);
    }
  };

  /** Submit: ubah password */
  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const { passwordLama, passwordBaru, konfirmasi } = pwForm;

    if (!passwordLama) { setPwError("Password lama wajib diisi."); return; }
    if (!passwordBaru || passwordBaru.length < 6) {
      setPwError("Password baru minimal 6 karakter."); return;
    }
    if (passwordBaru !== konfirmasi) {
      setPwError("Konfirmasi password tidak cocok."); return;
    }
    if (passwordLama === passwordBaru) {
      setPwError("Password baru harus berbeda dari password lama."); return;
    }

    setPwSubmit(true);
    setPwError("");
    try {
      const res = await fetch(apiUrl("/api/auth/me/password"), {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ passwordLama, passwordBaru }),
      });
      const data = await res.json();
      if (data.success) {
        setPwForm({ passwordLama: "", passwordBaru: "", konfirmasi: "" });
        setToast({ variant: "success", message: "Password berhasil diubah." });
      } else {
        setPwError(data.message || "Gagal mengubah password");
      }
    } catch (_) {
      setPwError("Koneksi gagal.");
    } finally {
      setPwSubmit(false);
    }
  };

  // ====================== Render ======================

  if (loading) {
    return (
      <main className="app-content">
        <h1>Profil</h1>
        <p className="app-muted">Memuat...</p>
      </main>
    );
  }

  if (loadError || !me) {
    return (
      <main className="app-content">
        <h1>Profil</h1>
        <p className="app-error">{loadError || "Profil tidak ditemukan."}</p>
      </main>
    );
  }

  return (
    <main className="app-content">
      <h1>Profil</h1>
      <p className="app-muted" style={{ marginBottom: "1rem", fontSize: "0.88rem" }}>
        Lihat info akun dan kelola password Anda sendiri.
      </p>

      {/* ============ SECTION 1: INFO SAYA ============ */}
      <section className="profile-card">
        <div className="profile-card-header">
          <h2>Info Saya</h2>
          <span className="app-muted" style={{ fontSize: "0.8rem" }}>Data read-only dari admin</span>
        </div>
        <div className="profile-identity">
          <UserCell name={me.nama} />
          <div className="profile-identity-meta">
            <div className="profile-identity-name">{me.nama}</div>
            <div className="profile-identity-sub">{me.email}</div>
          </div>
        </div>

        <div className="detail-meta-grid" style={{ marginTop: "1rem" }}>
          <div className="detail-meta-item">
            <span className="detail-meta-label">Role</span>
            <span className="detail-meta-value">
              <span className={`pill pill-${roleVariant(me.role)}`}>{labelRole(me.role)}</span>
            </span>
          </div>
          <div className="detail-meta-item">
            <span className="detail-meta-label">Status Akun</span>
            <span className="detail-meta-value">
              <span className={`pill pill-${statusVariant(me.statusAkun)}`}>{labelStatus(me.statusAkun)}</span>
            </span>
          </div>
          <div className="detail-meta-item">
            <span className="detail-meta-label">Terdaftar sejak</span>
            <span className="detail-meta-value">{toIdDate(me.createdAt)}</span>
          </div>
          <div className="detail-meta-item">
            <span className="detail-meta-label">Update terakhir</span>
            <span className="detail-meta-value">{toIdDate(me.updatedAt)}</span>
          </div>
        </div>
      </section>

      {/* ============ SECTION 2: UBAH DATA DIRI ============ */}
      <section className="profile-card">
        <div className="profile-card-header">
          <h2>Ubah Data Diri</h2>
          <span className="app-muted" style={{ fontSize: "0.8rem" }}>
            Untuk ubah role/status, hubungi admin.
          </span>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <label>Nama <span className="required">*</span></label>
          <input
            type="text"
            value={profileForm.nama}
            onChange={(e) => setProfileForm((f) => ({ ...f, nama: e.target.value }))}
            placeholder="Nama lengkap"
            required
          />

          <label>Email <span className="required">*</span></label>
          <input
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="nama@domain.com"
            required
          />

          <label>Divisi <span className="label-aux">— opsional</span></label>
          <input
            type="text"
            value={profileForm.divisi}
            onChange={(e) => setProfileForm((f) => ({ ...f, divisi: e.target.value }))}
            placeholder="Keuangan, SDM, IT, ..."
          />

          {profileError && (
            <div className="form-error">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="modal-actions-block">
            <button type="submit" className="btn-primary" disabled={profileSubmit}>
              {profileSubmit ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </section>

      {/* ============ SECTION 3: UBAH PASSWORD ============ */}
      <section className="profile-card">
        <div className="profile-card-header">
          <h2>Ubah Password</h2>
          <span className="app-muted" style={{ fontSize: "0.8rem" }}>
            Minimal 6 karakter. Password lama wajib.
          </span>
        </div>
        <form onSubmit={handlePwSubmit} autoComplete="off">
          <label>Password lama <span className="required">*</span></label>
          <input
            type="password"
            value={pwForm.passwordLama}
            onChange={(e) => setPwForm((f) => ({ ...f, passwordLama: e.target.value }))}
            placeholder="Password saat ini"
            required
            autoComplete="current-password"
          />

          <label>Password baru <span className="required">*</span></label>
          <input
            type="password"
            value={pwForm.passwordBaru}
            onChange={(e) => setPwForm((f) => ({ ...f, passwordBaru: e.target.value }))}
            placeholder="Minimal 6 karakter"
            required
            minLength={6}
            autoComplete="new-password"
          />

          <label>Konfirmasi password baru <span className="required">*</span></label>
          <input
            type="password"
            value={pwForm.konfirmasi}
            onChange={(e) => setPwForm((f) => ({ ...f, konfirmasi: e.target.value }))}
            placeholder="Ketik ulang password baru"
            required
            autoComplete="new-password"
          />

          {pwError && (
            <div className="form-error">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{pwError}</span>
            </div>
          )}

          <div className="modal-actions-block">
            <button type="submit" className="btn-primary" disabled={pwSubmit}>
              {pwSubmit ? "Menyimpan..." : "Ubah Password"}
            </button>
          </div>
        </form>
      </section>

      {/* ============ TOAST ============ */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast toast-${toast.variant}`}>
            <span className="toast-icon">
              <i className={`fa-solid ${
                toast.variant === "success" ? "fa-check"
                : toast.variant === "error" ? "fa-xmark"
                : "fa-info"
              }`} />
            </span>
            <span>{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => setToast(null)} title="Tutup">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
