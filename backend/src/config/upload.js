/**
 * Konfigurasi Multer untuk upload file (gambar barang).
 * File disimpan di folder uploads/ dengan nama unik.
 */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Folder uploads ada di tingkat backend (satu tingkat di atas src)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nama unik: timestamp-random- nama-asli (sanitasi extensi)
    const ext = (path.extname(file.originalname) || '').toLowerCase() || '.jpg';
    const safeName = (file.originalname || 'gambar').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    cb(null, name.endsWith(ext) ? name : name + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /image\/(jpeg|png|gif|webp)/.test(file.mimetype);
  if (allowed) cb(null, true);
  else cb(new Error('Hanya file gambar (JPEG, PNG, GIF, WebP) yang diizinkan.'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

/** Memory — dipakai /api/upload supaya bisa kirim buffer ke Supabase atau tulis ke disk sekali jalan */
const memoryStorage = multer.memoryStorage();
export const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export default upload;
