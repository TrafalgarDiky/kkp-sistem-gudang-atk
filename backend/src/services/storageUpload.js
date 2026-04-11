/**
 * Upload gambar ke Supabase Storage (production) — file tetap ada setelah redeploy.
 * Pakai SERVICE ROLE hanya di server (Railway Variables), jangan expose ke frontend.
 */
import { createClient } from '@supabase/supabase-js';
import path from 'path';

/** Nama bucket di Supabase Dashboard → Storage (harus public read untuk katalog) */
export const BARANG_BUCKET = 'barang-gambar';

export function isSupabaseStorageConfigured() {
  const u = process.env.SUPABASE_URL?.trim();
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(u && k);
}

/**
 * @param {Buffer} buffer
 * @param {string} originalname
 * @param {string} mimetype
 * @returns {Promise<{ url: string, path: string }>}
 */
export async function uploadImageToSupabase(buffer, originalname, mimetype) {
  const supabaseUrl = process.env.SUPABASE_URL.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ext = (path.extname(originalname || '') || '').toLowerCase() || '.jpg';
  const safeName = (originalname || 'gambar').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
  let objectName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  if (!objectName.toLowerCase().endsWith(ext)) objectName += ext;

  const { data, error } = await supabase.storage.from(BARANG_BUCKET).upload(objectName, buffer, {
    contentType: mimetype || 'image/jpeg',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || 'Gagal upload ke Supabase Storage');
  }

  const { data: pub } = supabase.storage.from(BARANG_BUCKET).getPublicUrl(data.path);
  return { url: pub.publicUrl, path: data.path };
}
