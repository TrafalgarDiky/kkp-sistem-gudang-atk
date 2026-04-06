/**
 * Helper untuk memanggil backend API.
 * Tujuan: satu tempat base URL + nanti bisa tambah header token di sini.
 */

/** Base URL API dari env (client-safe karena NEXT_PUBLIC_) */
export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

/**
 * URL lengkap ke endpoint API.
 * Contoh: apiUrl("/api/auth/login") → "http://localhost:3001/api/auth/login"
 */
export function apiUrl(path) {
  const base = getApiUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * URL gambar barang untuk <img src>.
 * - Relatif "/uploads/..." → pakai host API (bukan Next.js :3000).
 * - Absolut "http://host-lama:3001/uploads/..." (bekas PC lain) → ganti origin ke getApiUrl()
 *   supaya file di laptop ini yang diload.
 */
export function resolveBarangImageSrc(gambarUrl) {
  if (!gambarUrl) return null;
  const raw = String(gambarUrl).trim();
  const base = getApiUrl().replace(/\/$/, "");

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (u.pathname.startsWith("/uploads/")) {
        return `${base}${u.pathname}${u.search || ""}`;
      }
    } catch {
      /* bukan URL valid, jatuh ke bawah */
    }
    return raw;
  }

  const pathPart = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${pathPart}`;
}

/**
 * Header untuk request yang butuh login (Authorization: Bearer token).
 * Hanya jalan di browser (pakai localStorage).
 */
export function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
