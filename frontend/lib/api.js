/**
 * Helper untuk memanggil backend API.
 * Tujuan: satu tempat base URL + nanti bisa tambah header token di sini.
 */

/**
 * Base URL API dari env (client-safe karena NEXT_PUBLIC_).
 * Di browser HTTPS: paksa https untuk host non-local — cegah mixed content (gambar /uploads diblokir di HP).
 */
export function getApiUrl() {
  let base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  base = String(base).trim().replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    try {
      const u = new URL(base.startsWith("//") ? `https:${base}` : base);
      if (u.protocol === "http:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
        u.protocol = "https:";
        return u.toString().replace(/\/$/, "");
      }
    } catch {
      /* pakai base apa adanya */
    }
  }
  return base;
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

  const toHttpsIfPageHttps = (urlStr) => {
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      urlStr.startsWith("http://") &&
      !urlStr.includes("localhost") &&
      !urlStr.includes("127.0.0.1")
    ) {
      return `https://${urlStr.slice(7)}`;
    }
    return urlStr;
  };

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (u.pathname.startsWith("/uploads/")) {
        const merged = `${base}${u.pathname}${u.search || ""}`;
        return toHttpsIfPageHttps(merged);
      }
    } catch {
      /* bukan URL valid, jatuh ke bawah */
    }
    return toHttpsIfPageHttps(raw);
  }

  const pathPart = raw.startsWith("/") ? raw : `/${raw}`;
  return toHttpsIfPageHttps(`${base}${pathPart}`);
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
