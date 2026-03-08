// ============================================
// FILE: src/config/database.js
// FUNGSI: Setup koneksi Prisma Client ke database
// Tujuan: Satu instance Prisma Client untuk seluruh aplikasi
// ============================================
// Di Prisma 7, PrismaClient wajib pakai "adapter" untuk koneksi langsung ke PostgreSQL.

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Adapter dipakai Prisma 7 untuk koneksi ke database (tanpa Rust engine)
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

export default prisma;
