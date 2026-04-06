"use client";

import { useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import "../login/auth.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: data.message || "Periksa email Anda." });
        setEmail("");
      } else {
        setMsg({ type: "error", text: data.message || "Permintaan gagal." });
      }
    } catch {
      setMsg({ type: "error", text: "Koneksi gagal. Pastikan backend jalan." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-simple-card"
        style={{
          width: "min(420px, 92vw)",
          padding: "2rem",
          borderRadius: 20,
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.76)",
          boxShadow: "0 24px 52px rgba(55, 48, 163, 0.15)",
        }}
      >
        <h2 style={{ marginTop: 0, textAlign: "center" }}>Lupa password</h2>
        <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", marginBottom: "1.25rem" }}>
          Masukkan email terdaftar. Jika ada akun, kami mengirim tautan reset (atau cek log backend
          saat development tanpa SMTP).
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontFamily: "inherit",
            }}
          />
          {msg.text && (
            <p className={msg.type === "error" ? "error-msg" : "success-msg"} style={{ margin: 0 }}>
              {msg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: "#4f46e5",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Memproses…" : "Kirim tautan reset"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: 14 }}>
          <Link href="/login" style={{ color: "#4f46e5" }}>
            ← Kembali ke login
          </Link>
        </p>
      </div>
    </div>
  );
}
