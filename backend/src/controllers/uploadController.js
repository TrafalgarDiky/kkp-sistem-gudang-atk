/**
 * POST /api/upload — upload satu file gambar, kembalikan URL untuk disimpan di barang.
 */
import { successResponse, errorResponse } from '../utils/response.js';

const BASE_URL = process.env.BASE_URL || process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

export async function uploadGambar(req, res) {
  try {
    if (!req.file) {
      return errorResponse(res, 'Tidak ada file gambar yang dikirim', 400);
    }
    const url = `${BASE_URL.replace(/\/$/, '')}/uploads/${req.file.filename}`;
    return successResponse(res, 'Gambar berhasil diupload', { url, filename: req.file.filename });
  } catch (err) {
    console.error('Upload error:', err);
    return errorResponse(res, err.message || 'Gagal upload', 500);
  }
}
