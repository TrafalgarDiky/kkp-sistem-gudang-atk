// ============================================
// FILE: src/config/database.js
// FUNGSI: Setup koneksi Prisma Client ke database
// Tujuan: Satu instance Prisma Client untuk seluruh aplikasi
// ============================================
// Di Prisma 7, PrismaClient wajib pakai "adapter" untuk koneksi langsung ke PostgreSQL.

import '../loadEnv.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Driver pg + SCRAM membutuhkan password bertipe string.
 * URL `postgresql://user@host` (tanpa ":" untuk segmen password) sering bikin password = undefined → error SASL.
 */
function normalizePostgresDatabaseUrl(raw) {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) {
    throw new Error(
      'DATABASE_URL kosong. Lokal: isi backend/.env. Deploy (Railway/Render): tambah Variables DATABASE_URL (connection string Supabase). Lihat ENV_SETUP.md.'
    );
  }
  if (/^postgresql:\/\/[^:@]+@/i.test(s)) {
    return s.replace(/^postgresql:\/\/([^:@]+)@/i, 'postgresql://$1:@');
  }
  return s;
}

const connectionString = normalizePostgresDatabaseUrl(process.env.DATABASE_URL);

if (process.env.NODE_ENV === 'development') {
  try {
    const forUrl = connectionString.replace(/^postgresql:/i, 'http:');
    const u = new URL(forUrl);
    const dbName = u.pathname.replace(/^\//, '').split('?')[0] || '(?)';
    console.log('[database] DATABASE_URL →', {
      user: u.username || '(kosong)',
      host: u.hostname,
      port: u.port || '5432',
      database: dbName,
      password: u.password !== undefined && u.password !== '' ? '(diisi)' : '(kosong — OK untuk beberapa setup lokal)',
    });
  } catch {
    /* abaikan parse log */
  }
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

export default prisma;
