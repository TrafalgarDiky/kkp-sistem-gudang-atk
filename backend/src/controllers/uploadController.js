/**
 * POST /api/upload — simpan path relatif agar gambar jalan di semua device
 * (frontend gabungkan dengan NEXT_PUBLIC_API_URL).
 */
import { successResponse, errorResponse } from '../utils/response.js';

export async function uploadGambar(req, res) {
  try {
    if (!req.file) {
      return errorResponse(res, 'Tidak ada file gambar yang dikirim', 400);
    }
    const url = `/uploads/${req.file.filename}`;
    return successResponse(res, 'Gambar berhasil diupload', { url, filename: req.file.filename });
  } catch (err) {
    console.error('Upload error:', err);
    return errorResponse(res, err.message || 'Gagal upload', 500);
  }
}
