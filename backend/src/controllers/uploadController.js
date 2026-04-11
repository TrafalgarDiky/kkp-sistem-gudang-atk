/**
 * POST /api/upload — simpan gambar ke Supabase Storage (production) atau folder lokal (dev).
 * Response { url } disimpan di kolom gambar_url (URL publik Supabase atau path /uploads/...).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  isSupabaseStorageConfigured,
  uploadImageToSupabase,
} from '../services/storageUpload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

function buildLocalFilename(originalname) {
  const ext = (path.extname(originalname || '') || '').toLowerCase() || '.jpg';
  const safeName = (originalname || 'gambar').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  return name.toLowerCase().endsWith(ext) ? name : name + ext;
}

export async function uploadGambar(req, res) {
  try {
    if (!req.file?.buffer) {
      return errorResponse(res, 'Tidak ada file gambar yang dikirim', 400);
    }

    if (isSupabaseStorageConfigured()) {
      const { url } = await uploadImageToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      return successResponse(res, 'Gambar berhasil diupload (Supabase Storage)', {
        url,
        filename: url,
      });
    }

    await fs.mkdir(uploadDir, { recursive: true });
    const filename = buildLocalFilename(req.file.originalname);
    await fs.writeFile(path.join(uploadDir, filename), req.file.buffer);
    const url = `/uploads/${filename}`;
    return successResponse(res, 'Gambar berhasil diupload (lokal)', { url, filename });
  } catch (err) {
    console.error('Upload error:', err);
    return errorResponse(res, err.message || 'Gagal upload', 500);
  }
}
