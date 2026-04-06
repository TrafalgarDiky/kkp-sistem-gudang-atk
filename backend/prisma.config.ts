// Load .env: Prisma kadang menjalankan config dari path lain, jadi coba beberapa lokasi.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";
import { applyFallbackEnvFromFile } from "./env-fallback.js";

const configDir = path.dirname(fileURLToPath(import.meta.url));
// Utamakan .env di folder backend (satu tingkat dengan prisma.config.ts)
const envCandidates = [
  path.join(configDir, ".env"),
  path.join(process.cwd(), ".env"),
];

let loadedPath: string | null = null;
let parsedCount = 0;
for (const envPath of envCandidates) {
  if (!fs.existsSync(envPath)) continue;
  const result = dotenv.config({ path: envPath, override: true });
  loadedPath = envPath;
  if (result.parsed) parsedCount = Object.keys(result.parsed).length;
  if (process.env.DATABASE_URL?.trim()) break;
}

// dotenv bisa baca 0 variabel jika .env UTF-16 / BOM (sering dari Notepad "Unicode")
if (!process.env.DATABASE_URL?.trim()) {
  for (const envPath of envCandidates) {
    if (!fs.existsSync(envPath)) continue;
    const { count } = applyFallbackEnvFromFile(envPath);
    if (count > 0) {
      loadedPath = envPath;
      parsedCount = count;
      console.warn(
        `[prisma.config] Parser cadangan memuat ${count} variabel dari ${envPath}. Simpan .env sebagai UTF-8.`
      );
    }
    if (process.env.DATABASE_URL?.trim()) break;
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  const hint = [
    "[prisma.config] DATABASE_URL tidak terbaca.",
    loadedPath
      ? `File dipakai: ${loadedPath} (isi ${parsedCount} variabel — mungkin kosong/salah format).`
      : "Tidak ada file .env yang ditemukan.",
    "Coba:",
    `  1) Buat/edit: ${path.join(process.cwd(), ".env")}`,
    "  2) Isi baris: DATABASE_URL=\"postgresql://USER:PASSWORD@localhost:5432/gudang_atk?schema=public\"",
    "  3) Jalankan npm run prisma:migrate dari folder backend (tempat ada package.json).",
    "  4) Di Windows: pastikan nama file benar-benar .env (bukan .env.txt).",
  ].join("\n");
  console.error(hint);
}

/** Hindari error pg SCRAM: password harus string (URL tanpa ":pass" → sisipkan ":@"). */
function normalizePgUrl(u: string | undefined): string | undefined {
  if (!u?.trim()) return undefined;
  const s = u.trim();
  if (/^postgresql:\/\/[^:@]+@/i.test(s)) {
    return s.replace(/^postgresql:\/\/([^:@]+)@/i, "postgresql://$1:@");
  }
  return s;
}

const databaseUrl = normalizePgUrl(process.env["DATABASE_URL"]);
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL wajib diisi di backend/.env (lihat pesan [prisma.config] di atas dan ENV_SETUP.md)."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
    // Shadow database HARUS beda dari database utama. Set SHADOW_DATABASE_URL di .env (lihat ENV_SETUP.md).
    ...(process.env["SHADOW_DATABASE_URL"] && {
      shadowDatabaseUrl: normalizePgUrl(process.env["SHADOW_DATABASE_URL"]),
    }),
  },
});
