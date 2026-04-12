/**
 * Upload gambar ke Supabase Storage (production) — file tetap ada setelah redeploy.
 * Pakai SERVICE ROLE hanya di server (Railway Variables), jangan expose ke frontend.
 */
import { createClient } from '@supabase/supabase-js';
import path from 'path';

/** Hapus kutip pembungkus & whitespace — sering penyebab "Invalid Compact JWS" di Railway. */
function normalizeSecretEnv(value) {
  if (value == null || typeof value !== 'string') return '';
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  // JWT compact tidak boleh ada newline/spasi di tengah (copy-paste dari dashboard)
  return v.replace(/\s+/g, '');
}

function normalizeUrlEnv(value) {
  if (value == null || typeof value !== 'string') return '';
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/\/+$/, '');
}

function getSupabaseEnv() {
  const url = normalizeUrlEnv(process.env.SUPABASE_URL || '');
  const key = normalizeSecretEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  if (!url || !key) return null;
  return { url, key };
}

/** Nama bucket: harus sama persis dengan di Supabase Storage (tanpa kutip di value). */
function normalizeBucketName(value) {
  if (value == null || typeof value !== 'string') return '';
  let v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/**
 * Nama bucket di Supabase → Storage (harus public read untuk katalog).
 * Default `barang-gambar`. Urutan: SUPABASE_STORAGE_BUCKET → SUPABASE_BUCKET → STORAGE_BUCKET.
 */
export function getBarangBucketName() {
  const chain = [
    process.env.SUPABASE_STORAGE_BUCKET,
    process.env.SUPABASE_BUCKET,
    process.env.STORAGE_BUCKET,
  ];
  for (const raw of chain) {
    const n = normalizeBucketName(raw || '');
    if (n) return n;
  }
  return 'barang-gambar';
}

/** Nama env yang isinya dipakai untuk bucket (untuk debug health), atau null. */
export function getBucketEnvSourceName() {
  if (normalizeBucketName(process.env.SUPABASE_STORAGE_BUCKET || '')) return 'SUPABASE_STORAGE_BUCKET';
  if (normalizeBucketName(process.env.SUPABASE_BUCKET || '')) return 'SUPABASE_BUCKET';
  if (normalizeBucketName(process.env.STORAGE_BUCKET || '')) return 'STORAGE_BUCKET';
  return null;
}

export function isSupabaseStorageConfigured() {
  return Boolean(getSupabaseEnv());
}

/**
 * @param {Buffer} buffer
 * @param {string} originalname
 * @param {string} mimetype
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadImageToSupabase(buffer, originalname, mimetype) {
  const cfg = getSupabaseEnv();
  if (!cfg) {
    throw new Error('SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY kosong');
  }

  const { url: supabaseUrl, key: serviceKey } = cfg;
  const parts = serviceKey.split('.');
  if (!serviceKey.startsWith('eyJ') || parts.length !== 3) {
    const sbHint = serviceKey.startsWith('sb_secret')
      ? ' Jangan pakai Secret Key bentuk sb_secret_... — itu beda format. Di Supabase → Settings → API, cari key JWT "service_role" (panjang, dimulai eyJ, ada titik dua kali).'
      : ' Salin key "service_role" (bukan anon), dimulai eyJ.';
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY harus JWT service_role (eyJ + 3 segmen).${sbHint}`
    );
  }

  let supabase;
  try {
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (e) {
    const m = e?.message || String(e);
    if (/jws|jwt/i.test(m)) {
      throw new Error(
        'Key Supabase tidak valid (JWS). Di Railway: hapus kutip di value, pastikan satu baris penuh, pakai service_role bukan placeholder.'
      );
    }
    throw e;
  }

  const ext = (path.extname(originalname || '') || '').toLowerCase() || '.jpg';
  const safeName = (originalname || 'gambar').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
  let objectName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  if (!objectName.toLowerCase().endsWith(ext)) objectName += ext;

  const bucket = getBarangBucketName();
  let data;
  let error;
  try {
    const out = await supabase.storage.from(bucket).upload(objectName, buffer, {
      contentType: mimetype || 'image/jpeg',
      upsert: false,
    });
    data = out.data;
    error = out.error;
  } catch (e) {
    const m = e?.message || String(e);
    if (/jws|jwt/i.test(m)) {
      throw new Error(
        'Gagal autentikasi ke Supabase (JWS). Periksa SUPABASE_SERVICE_ROLE_KEY dan SUPABASE_URL di Railway — salin ulang dari dashboard, tanpa spasi/kutip tambahan.'
      );
    }
    throw e;
  }

  if (error) {
    let msg = error.message || 'Gagal upload ke Supabase Storage';
    if (/bucket not found|not found/i.test(msg)) {
      msg += ` — Backend memakai bucket "${bucket}". Di Railway set SUPABASE_STORAGE_BUCKET sama persis dengan nama bucket di Supabase (mis. foto-barang). Kalau env kosong/salah nama, default adalah "barang-gambar".`;
    }
    throw new Error(msg);
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { url: pub.publicUrl, path: data.path };
}
