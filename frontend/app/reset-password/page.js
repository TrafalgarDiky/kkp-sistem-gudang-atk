"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/api";
import "../login/auth.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (password !== confirm) {
      setMsg({ type: "error", text: "Password dan konfirmasi tidak sama." });
      return;
    }
    if (password.length < 6) {
      setMsg({ type: "error", text: "Password minimal 6 karakter." });
      return;
    }
    if (!tokenFromUrl.trim()) {
      setMsg({ type: "error", text: "Tautan tidak valid. Minta reset dari halaman lupa password." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: data.message || "Berhasil. Mengalihkan ke login…" });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setMsg({ type: "error", text: data.message || "Gagal mengubah password." });
      }
    } catch {
      setMsg({ type: "error", text: "Koneksi gagal." });
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <h2 style={{ marginTop: 0, textAlign: "center" }}>Password baru</h2>
      <p style={{ color: "#64748b", fontSize: 14, textAlign: "center" }}>
        Tautan berlaku 1 jam. Setelah berhasil, login dengan password baru.
      </p>
      {!tokenFromUrl && (
        <p className="error-msg">Parameter token hilang. Buka tautan dari email atau log backend (mode dev).</p>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          type="password"
          placeholder="Password baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontFamily: "inherit",
          }}
        />
        <input
          type="password"
          placeholder="Konfirmasi password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
          disabled={loading || !tokenFromUrl}
          style={{
            padding: "12px",
            borderRadius: 10,
            border: "none",
            background: "#4f46e5",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            opacity: !tokenFromUrl ? 0.6 : 1,
          }}
        >
          {loading ? "Menyimpan…" : "Simpan password"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: 14 }}>
        <Link href="/login" style={{ color: "#4f46e5" }}>
          ← Login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <Suspense
        fallback={
          <div style={{ color: "#64748b" }}>Memuat…</div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
