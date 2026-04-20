"use client";

/**
 * Halaman Login & Register — sama seperti design di folder login.
 * Cara kerja toggle (sesuai script kamu):
 * - Saat register tampil: hero.register + form.register punya class "active", card-bg tanpa class "login" (background ungu di kiri).
 * - Saat klik LOGIN: toggleView() → hero.login + form.login dapat "active", card-bg dapat "login" (background ungu geser ke kanan).
 * - Saat klik DAFTAR: toggleView() → kembali ke register active, card-bg tanpa "login".
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import "./auth.css";

/** Key localStorage untuk email yang diingat (bukan password — password tidak boleh disimpan di JS). */
const REMEMBER_EMAIL_KEY = "gatk_remember_email";

export default function LoginPage() {
  const router = useRouter();
  // false = tampil Register (default), true = tampil Login
  const [isLoginView, setIsLoginView] = useState(false);
  /** Jika token masih ada di browser, user dianggap sudah login → langsung ke dashboard (tidak perlu isi form lagi). */
  const [checkingSession, setCheckingSession] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  /** Centang = simpan email ke localStorage setelah login sukses (tetap harus ketik password). */
  const [rememberEmail, setRememberEmail] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
      return;
    }
    // Tanpa token: boleh isi email otomatis jika user pernah centang "Ingat email saya"
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberEmail(true);
    }
    setCheckingSession(false);
  }, [router]);

  const [regNama, setRegNama] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDivisi, setRegDivisi] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("STAFF");
  const [regMessage, setRegMessage] = useState({ type: "", text: "" });
  const [regLoading, setRegLoading] = useState(false);

  // Visibility toggle password (show = tampil teks, hide = bullet)
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);

  const toggleView = () => {
    setIsLoginView((prev) => !prev);
    setLoginError("");
    setRegMessage({ type: "", text: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setLoginError(data.message || "Login gagal");
        return;
      }
      const token = data.data?.token;
      const user = data.data?.user;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("token", token);
        if (user) localStorage.setItem("user", JSON.stringify(user));
        if (rememberEmail && loginEmail.trim()) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, loginEmail.trim().toLowerCase());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
        router.push("/dashboard");
      } else {
        setLoginError("Token tidak diterima. Coba lagi.");
      }
    } catch (err) {
      setLoginError(
        "Tidak bisa menghubungi API. Cek: (1) NEXT_PUBLIC_API_URL di Vercel = URL Railway, (2) FRONTEND_URL di Railway berisi URL situs ini persis (https://...), bisa beberapa URL pisah koma. (3) /api/health backend hidup."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMessage({ type: "", text: "" });
    if (!regDivisi.trim()) {
      setRegMessage({ type: "error", text: "Divisi wajib diisi." });
      return;
    }
    if (regPassword.length < 6) {
      setRegMessage({ type: "error", text: "Password minimal 6 karakter." });
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: regNama.trim(),
          email: regEmail.trim(),
          divisi: regDivisi.trim(),
          password: regPassword,
          role: regRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegMessage({ type: "success", text: data.message || "Registrasi berhasil. Menunggu verifikasi admin." });
        setRegNama("");
        setRegEmail("");
        setRegDivisi("");
        setRegPassword("");
      } else {
        setRegMessage({ type: "error", text: data.message || "Registrasi gagal." });
      }
    } catch (err) {
      setRegMessage({
        type: "error",
        text: "Tidak bisa menghubungi API. Samakan FRONTEND_URL di Railway dengan URL Vercel yang kamu buka, dan NEXT_PUBLIC_API_URL ke Railway.",
      });
    } finally {
      setRegLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="auth-page">
        <p className="auth-loading" style={{ textAlign: "center", padding: "2rem" }}>
          Memeriksa sesi...
        </p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Brand / Logo di atas kotak login-register */}
      <div className="auth-brand" aria-label="GATK">
        <div className="auth-brand-icon" aria-hidden="true">
          <img src="/6454239.gif" alt="" />
        </div>
        <div className="auth-brand-text">
          <div className="auth-brand-name">GATK</div>
          <div className="auth-brand-tagline">Memenuhi Kebutuhan Kerja Anda</div>
        </div>
      </div>

      <div className="card">
        {/* Background ungu: tanpa .login = kiri, dengan .login = geser kanan (translate 100%) */}
        <div className={`card-bg ${isLoginView ? "login" : ""}`} />

        {/* HERO REGISTER — tampil saat register active */}
        <div className={`hero register ${!isLoginView ? "active" : ""}`}>
          <h2>Selamat datang</h2>
          <p>Masuk jika sudah mendaftar</p>
          <button type="button" onClick={toggleView}>
            MASUK
          </button>
        </div>

        {/* FORM REGISTER */}
        <div className={`form register ${!isLoginView ? "active" : ""}`}>
          <h2>Daftar</h2>
          <p>Gunakan email Anda</p>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Nama lengkap"
              value={regNama}
              onChange={(e) => setRegNama(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Divisi"
              value={regDivisi}
              onChange={(e) => setRegDivisi(e.target.value)}
              required
            />
            <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
              <option value="PETUGAS">Petugas</option>
            </select>
            <div className="password-wrap">
              <input
                type={showRegPw ? "text" : "password"}
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowRegPw((p) => !p)}
                title={showRegPw ? "Sembunyikan" : "Tampilkan"}
                aria-label={showRegPw ? "Sembunyikan password" : "Tampilkan password"}
              >
                <i className={showRegPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
              </button>
            </div>
            {regMessage.text && (
              <p className={regMessage.type === "error" ? "error-msg" : "success-msg"}>{regMessage.text}</p>
            )}
            <button type="submit" disabled={regLoading}>
              {regLoading ? "Loading..." : "DAFTAR"}
            </button>
          </form>
        </div>

        {/* HERO LOGIN — tampil saat login active */}
        <div className={`hero login ${isLoginView ? "active" : ""}`}>
          <h2>Holla</h2>
          <p>Mulai daftar kelola permintaan Anda.</p>
          <button type="button" onClick={toggleView}>
            DAFTAR
          </button>
        </div>

        {/* FORM LOGIN */}
        <div className={`form login ${isLoginView ? "active" : ""}`}>
          <h2>Masuk</h2>
          <p>Gunakan akun Anda</p>
          <form onSubmit={handleLogin} autoComplete="on">
            <input
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="username"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <div className="password-wrap">
              <input
                type={showLoginPw ? "text" : "password"}
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowLoginPw((p) => !p)}
                title={showLoginPw ? "Sembunyikan" : "Tampilkan"}
                aria-label={showLoginPw ? "Sembunyikan password" : "Tampilkan password"}
              >
                <i className={showLoginPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
              </button>
            </div>
            <div className="auth-login-extras">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                />
                <span>Ingat email saya</span>
              </label>
              <Link href="/forgot-password" className="forgot">
                Lupa password?
              </Link>
            </div>
            {loginError && <p className="error-msg">{loginError}</p>}
            <button type="submit" disabled={loginLoading}>
              {loginLoading ? "Loading..." : "LOGIN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
