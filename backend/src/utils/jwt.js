// ============================================
// FILE: src/utils/jwt.js
// FUNGSI: Buat dan verifikasi JWT (JSON Web Token)
// Tujuan: Token dipakai untuk autentikasi setelah login
// ============================================

import jwt from 'jsonwebtoken';

// JWT_SECRET dari .env — dipakai untuk "tandatangan" token. Harus rahasia.
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
// Lama token valid (contoh: 7 hari)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Buat token JWT untuk user yang sudah login.
 * @param {string} userId - id user (dari database)
 * @param {string} email - email user
 * @param {string} role - role: STAFF | ADMIN | PETUGAS
 * @returns {string} token
 */
export function signToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifikasi token dan kembalikan payload (userId, email, role).
 * @param {string} token - token dari header Authorization
 * @returns {{ userId, email, role } | null} payload atau null jika invalid
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}
