// ============================================
// FILE: src/server.js
// FUNGSI: Entry point server Express
// Tujuan: Menjalankan web server API
// ============================================

// HARUS paling atas: isi process.env dari backend/.env (path tetap, tidak tergantung cwd)
import './loadEnv.js';

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import barangRoutes from './routes/barangRoutes.js';
import permintaanRoutes from './routes/permintaanRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import restockRoutes from './routes/restockRoutes.js';
import logStokRoutes from './routes/logStokRoutes.js';
import laporanRoutes from './routes/laporanRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import deviceTokenRoutes from './routes/deviceTokenRoutes.js';
import { requireAuth, requireRole } from './middleware/authMiddleware.js';
import { listPendingUsers, verifyUser } from './controllers/authController.js';
import {
  isSupabaseStorageConfigured,
  getBarangBucketName,
  getBucketEnvSourceName,
} from './services/storageUpload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

// ============================================
// SETUP EXPRESS APP
// ============================================
const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Railway/Vercel biasanya ada di belakang reverse proxy.
 * Ini penting agar `req.ip` terbaca benar untuk rate limit.
 */
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARE
// ============================================

// Rate limit dasar (semua request) untuk mengurangi abuse trafik.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  limit: 600, // 600 request / 15 menit / IP (internal kantor biasanya aman)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak request. Coba lagi beberapa menit.',
    });
  },
});
app.use(globalLimiter);

// Rate limit ketat khusus auth untuk mencegah brute force.
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10, // 10 kali coba login / 15 menit / IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Tunggu 15 menit lalu coba lagi.',
    });
  },
});

const authForgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5, // 5 kali / 1 jam / IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak permintaan reset password. Coba lagi nanti.',
    });
  },
});

// CORS: Izinkan request dari frontend (Next.js)
// - FRONTEND_URL: daftar eksplisit (pisah koma)
// - Host *.vercel.app: otomatis diizinkan (preview deploy punya URL beda tiap commit, tidak praktis dicantumkan satu per satu)
// - gatk.my.id + subdomain: domain produksi Cloudflare (frontend di gatk.my.id, API di api.gatk.my.id)
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  if (frontendOrigins.includes(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
    if (u.hostname.endsWith('.vercel.app')) return true;
    if (u.hostname === 'gatk.my.id' || u.hostname.endsWith('.gatk.my.id')) return true;
  } catch {
    return false;
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (isAllowedCorsOrigin(origin)) {
        return callback(null, origin);
      }
      return callback(new Error(`CORS: origin tidak diizinkan: ${origin}`));
    },
    credentials: true,
  })
);

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.FRONTEND_URL?.trim() ||
    process.env.FRONTEND_URL.includes('localhost'))
) {
  console.warn(
    '[CORS] FRONTEND_URL belum set ke domain Vercel — preview *.vercel.app tetap diizinkan; untuk email reset password / tautan absolut, set FRONTEND_URL ke URL production kamu.'
  );
}

// Body parser: Parse JSON dari request body
app.use(express.json());

// Request logger sederhana (untuk debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint (untuk test API jalan atau tidak)
/** Hanya nama key + panjang string — nilai secret tidak dikirim (bantu cek typo di Railway). */
function supabaseEnvKeySummary() {
  return Object.keys(process.env)
    .filter((k) => k.startsWith('SUPABASE_'))
    .sort()
    .map((name) => ({
      name,
      valueChars: process.env[name] ? String(process.env[name]).trim().length : 0,
    }));
}

app.get('/api/health', (req, res) => {
  const supabase = isSupabaseStorageConfigured();
  const bucketSource = getBucketEnvSourceName();
  const bucketEnvDefined = Boolean(bucketSource);
  res.json({
    success: true,
    message: 'API Server is running!',
    timestamp: new Date().toISOString(),
    /** Cek dari browser: mode upload + nama bucket (tanpa secret). */
    storage: supabase
      ? {
          mode: 'supabase',
          bucket: getBarangBucketName(),
          bucketEnvDefined,
          /** Env mana yang memuat nama bucket (mis. SUPABASE_STORAGE_BUCKET). */
          bucketEnvSource: bucketSource,
          /** Daftar key SUPABASE_* yang benar-benar ada di proses Node + panjang value (bukan isi value). */
          supabaseEnvKeySummary: supabaseEnvKeySummary(),
        }
      : {
          mode: 'local_uploads',
          bucket: null,
          bucketEnvDefined,
          bucketEnvSource: bucketSource,
          supabaseEnvKeySummary: supabaseEnvKeySummary(),
        },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Gudang ATK API',
    version: '1.0.0'
  });
});

// API Routes — pending & verify didaftarkan di app langsung agar pasti terbaca
app.get('/api/auth/pending', requireAuth, requireRole(['ADMIN']), listPendingUsers);
app.patch('/api/auth/users/:id/verify', requireAuth, requireRole(['ADMIN']), verifyUser);

// Rate limit endpoint auth yang sering di-spam
app.use('/api/auth/login', authLoginLimiter);
app.use('/api/auth/forgot-password', authForgotLimiter);
app.use('/api/auth/reset-password', authForgotLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/device-token', deviceTokenRoutes);

// Barang (katalog ATK)
app.use('/api/barang', barangRoutes);

// Permintaan ATK (Staff buat → Admin approve → Petugas selesai, stok berkurang)
app.use('/api/permintaan', permintaanRoutes);

// Restock & Log Stok & Laporan (ADMIN)
app.use('/api/restock', restockRoutes);
app.use('/api/log-stok', logStokRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/admin', adminRoutes);

// Upload gambar — GET /uploads/namafile (folder: backend/uploads, BUKAN frontend)
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.warn('[server] Folder uploads dibuat:', uploadsDir);
} else {
  try {
    const n = fs.readdirSync(uploadsDir).filter((f) => !f.startsWith('.')).length;
    console.log(`📂 Uploads (${n} file): ${uploadsDir}`);
  } catch {
    console.log('📂 Uploads:', uploadsDir);
  }
}
// Header ini membantu browser memuat gambar dari domain lain (Vercel → Railway) tanpa diblokir kebijakan CORP
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  })
);
app.use('/api/upload', uploadRoutes);

// Daftar route auth (untuk debug — bisa dihapus nanti)
app.get('/api/debug/routes', (req, res) => {
  res.json({
    auth: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'GET  /api/auth/pending (Auth: Bearer token, role ADMIN)',
      'PATCH /api/auth/users/:id/verify (Auth: Bearer token, role ADMIN)'
    ]
  });
});

// ============================================
// ERROR HANDLER (Middleware untuk handle error)
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// 404 HANDLER (Route tidak ditemukan)
// ============================================
app.use((req, res) => {
  if (req.path.startsWith('/uploads/')) {
    return res.status(404).json({
      success: false,
      message:
        'File gambar tidak ada di server. Salin file ke folder uploads backend dengan nama persis seperti di URL (cek kolom gambar_url di database).',
      uploadsFolder: uploadsDir,
      requestedPath: req.path,
    });
  }
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  if (isSupabaseStorageConfigured()) {
    const b = getBarangBucketName();
    const src = getBucketEnvSourceName();
    console.log(
      `[storage] Supabase aktif — bucket: "${b}" | sumber env bucket: ${src || 'TIDAK ADA — set SUPABASE_STORAGE_BUCKET=foto-barang di service backend + Redeploy'}`
    );
    if (!src && b === 'barang-gambar') {
      const keys = Object.keys(process.env)
        .filter((k) => k.startsWith('SUPABASE_'))
        .sort()
        .join(', ');
      console.warn(`[storage] Key SUPABASE_* yang terlihat Node: ${keys || '(kosong)'}`);
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[storage] Upload gambar ke folder container saja — file bisa hilang saat redeploy. ' +
        'Production: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (+ SUPABASE_STORAGE_BUCKET jika nama bucket bukan barang-gambar). Lihat backend/ENV_SETUP.md.'
    );
  }
});
