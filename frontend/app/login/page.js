"use client";

/**
 * Halaman Login & Register — sama seperti design di folder login.
 * Cara kerja toggle (sesuai script kamu):
 * - Saat register tampil: hero.register + form.register punya class "active", card-bg tanpa class "login" (background ungu di kiri).
 * - Saat klik LOGIN: toggleView() → hero.login + form.login dapat "active", card-bg dapat "login" (background ungu geser ke kanan).
 * - Saat klik SIGN UP: toggleView() → kembali ke register active, card-bg tanpa "login".
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import "./auth.css";

export default function LoginPage() {
  const router = useRouter();
  // false = tampil Register (default), true = tampil Login
  const [isLoginView, setIsLoginView] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regNama, setRegNama] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regRole, setRegRole] = useState("STAFF");
  const [regMessage, setRegMessage] = useState({ type: "", text: "" });
  const [regLoading, setRegLoading] = useState(false);

  // Visibility toggle password (show = tampil teks, hide = bullet)
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const [showRegPwConfirm, setShowRegPwConfirm] = useState(false);

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
        router.push("/dashboard");
      } else {
        setLoginError("Token tidak diterima. Coba lagi.");
      }
    } catch (err) {
      setLoginError("Koneksi gagal. Pastikan backend jalan.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMessage({ type: "", text: "" });
    if (regPassword !== regPasswordConfirm) {
      setRegMessage({ type: "error", text: "Password dan konfirmasi tidak sama." });
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
          password: regPassword,
          role: regRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegMessage({ type: "success", text: data.message || "Registrasi berhasil. Menunggu verifikasi admin." });
        setRegNama("");
        setRegEmail("");
        setRegPassword("");
        setRegPasswordConfirm("");
      } else {
        setRegMessage({ type: "error", text: data.message || "Registrasi gagal." });
      }
    } catch (err) {
      setRegMessage({ type: "error", text: "Koneksi gagal. Pastikan backend jalan." });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card">
        {/* Background ungu: tanpa .login = kiri, dengan .login = geser kanan (translate 100%) */}
        <div className={`card-bg ${isLoginView ? "login" : ""}`} />

        {/* HERO REGISTER — tampil saat register active */}
        <div className={`hero register ${!isLoginView ? "active" : ""}`}>
          <h2>Welcome back</h2>
          <p>Login jika sudah mendaftar.</p>
          <button type="button" onClick={toggleView}>
            LOGIN
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
            <div className="password-wrap">
              <input
                type={showRegPwConfirm ? "text" : "password"}
                placeholder="Konfirmasi password"
                value={regPasswordConfirm}
                onChange={(e) => setRegPasswordConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowRegPwConfirm((p) => !p)}
                title={showRegPwConfirm ? "Sembunyikan" : "Tampilkan"}
                aria-label={showRegPwConfirm ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}
              >
                <i className={showRegPwConfirm ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
              </button>
            </div>
            {regMessage.text && (
              <p className={regMessage.type === "error" ? "error-msg" : "success-msg"}>{regMessage.text}</p>
            )}
            <button type="submit" disabled={regLoading}>
              {regLoading ? "Loading..." : "SIGN UP"}
            </button>
          </form>
        </div>

        {/* HERO LOGIN — tampil saat login active */}
        <div className={`hero login ${isLoginView ? "active" : ""}`}>
          <h2>Holla</h2>
          <p>Mulai daftar kelola permintaan Anda.</p>
          <button type="button" onClick={toggleView}>
            SIGN UP
          </button>
        </div>

        {/* FORM LOGIN */}
        <div className={`form login ${isLoginView ? "active" : ""}`}>
          <h2>Login</h2>
          <p>Gunakan akun Anda</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <div className="password-wrap">
              <input
                type={showLoginPw ? "text" : "password"}
                placeholder="Password"
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
            <Link href="/forgot-password" className="forgot">
              Lupa password?
            </Link>
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
