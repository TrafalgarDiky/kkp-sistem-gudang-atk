// ============================================
// FILE: src/middleware/authMiddleware.js
// FUNGSI: Verifikasi JWT dan attach user ke request
// Dipakai di route yang butuh login (misal: buat permintaan, kelola barang)
// ============================================

import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware: cek header Authorization: Bearer <token>.
 * Jika valid, isi req.user = { userId, email, role }.
 * Jika tidak valid, kirim 401.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return errorResponse(res, 'Token tidak ada. Silakan login.', 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    return errorResponse(res, 'Token tidak valid atau kedaluwarsa. Silakan login lagi.', 401);
  }

  req.user = payload; // { userId, email, role }
  next();
}

/**
 * Middleware: hanya role tertentu yang boleh akses (pakai setelah requireAuth).
 * @param {string[]} allowedRoles - misal ['ADMIN']
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Akses ditolak. Role tidak sesuai.', 403);
    }
    next();
  };
}
