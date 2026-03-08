"use client";

/**
 * AuthGuard — proteksi route: hanya render children jika ada token.
 * Tujuan: halaman dashboard/barang/permintaan hanya bisa diakses setelah login.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="auth-loading">
        <p>Memeriksa login...</p>
      </div>
    );
  }

  return children;
}
