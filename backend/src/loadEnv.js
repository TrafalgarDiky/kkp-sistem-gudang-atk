// ============================================
// Wajib di-import PERTAMA dari server.js
// Memuat .env dari folder backend (bukan tergantung cwd terminal)
// ============================================

import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyFallbackEnvFromFile } from '../env-fallback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
// Utamakan backend/.env (pasti benar), baru .env di cwd terminal
const envCandidates = [path.join(backendRoot, '.env'), path.join(process.cwd(), '.env')];

let loadedPath = null;
for (const envPath of envCandidates) {
  if (!fs.existsSync(envPath)) continue;
  const st = fs.statSync(envPath);
  if (st.size === 0) {
    console.error(
      `[loadEnv] File .env KOSONG di disk (0 byte): ${envPath}\n` +
        '→ Biasanya isi ada di editor tapi belum disimpan. Tekan Ctrl+S, lalu restart npm run dev.\n' +
        '→ Atau isi minimal baris: DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/gudang_atk?schema=public"'
    );
  }
  loadedPath = envPath;
  dotenv.config({ path: envPath, override: true });
  if (process.env.DATABASE_URL?.trim()) break;
}

// dotenv bisa lapor "injecting env (0)" jika .env UTF-16 / BOM — parser manual jadi cadangan
if (!process.env.DATABASE_URL?.trim()) {
  for (const envPath of envCandidates) {
    if (!fs.existsSync(envPath)) continue;
    const { count } = applyFallbackEnvFromFile(envPath);
    if (count > 0 && process.env.NODE_ENV !== 'test') {
      console.warn(
        `[loadEnv] dotenv gagal memuat ${envPath}; parser cadangan memuat ${count} variabel. Simpan .env sebagai UTF-8 (Notepad → Save as → Encoding: UTF-8).`
      );
    }
    if (process.env.DATABASE_URL?.trim()) break;
  }
}

// Di Docker/Railway tidak ada .env di disk — DATABASE_URL dari Variables platform (wajar).
if (!loadedPath && process.env.NODE_ENV !== 'test' && !process.env.DATABASE_URL?.trim()) {
  console.warn(
    '[loadEnv] Tidak ada file .env dan DATABASE_URL belum di environment. Lokal: buat backend/.env. Deploy: set Variables (Railway/Render). Dicoba path:\n  -',
    envCandidates.join('\n  - ')
  );
}
