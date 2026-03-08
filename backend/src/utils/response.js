// ============================================
// FILE: src/utils/response.js
// FUNGSI: Helper untuk format response API yang konsisten
// Tujuan: Semua endpoint pakai format { success, message, data }
// ============================================

/**
 * Format response sukses
 * @param {Object} res - Express response object
 * @param {string} message - Pesan sukses
 * @param {any} data - Data yang dikembalikan
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data })
  });
};

/**
 * Format response error
 * @param {Object} res - Express response object
 * @param {string} message - Pesan error
 * @param {number} statusCode - HTTP status code (default: 400)
 */
export const errorResponse = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};
