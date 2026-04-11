// ============================================
// FILE: src/server.js
// FUNGSI: Entry point server Express
// Tujuan: Menjalankan web server API
// ============================================

// HARUS paling atas: isi process.env dari backend/.env (path tetap, tidak tergantung cwd)
import './loadEnv.js';

import express from 'express';
import cors from 'cors';
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
import { requireAuth, requireRole } from './middleware/authMiddleware.js';
import { listPendingUsers, verifyUser } from './controllers/authController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

// ============================================
// SETUP EXPRESS APP
// ============================================
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// CORS: Izinkan request dari frontend (Next.js)
// FRONTEND_URL bisa beberapa domain (pisah koma), mis. Vercel production + preview:
// https://app.vercel.app,https://app-git-main-xxx.vercel.app
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const corsOrigin =
  frontendOrigins.length === 0
    ? 'http://localhost:3000'
    : frontendOrigins.length === 1
      ? frontendOrigins[0]
      : frontendOrigins;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.FRONTEND_URL?.trim() ||
    process.env.FRONTEND_URL.includes('localhost'))
) {
  console.warn(
    '[CORS] Di production, set FRONTEND_URL di Railway ke URL Vercel (mis. https://xxx.vercel.app). Tanpa itu, browser memakai default localhost dan request dari Vercel diblokir.'
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
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Server is running!',
    timestamp: new Date().toISOString()
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
app.use('/api/auth', authRoutes);

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
app.use('/uploads', express.static(uploadsDir));
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
});
