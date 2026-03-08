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
 * Header untuk request yang butuh login (Authorization: Bearer token).
 * Hanya jalan di browser (pakai localStorage).
 */
export function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
