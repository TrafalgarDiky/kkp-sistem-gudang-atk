/**
 * Daftar satuan baku untuk barang ATK.
 * Dipakai lintas form agar penulisan konsisten.
 */
export const SATUAN_OPTIONS = ["pcs", "dus", "box", "botol", "pack", "rim", "lembar"];

/**
 * Alias satuan lama -> satuan baku.
 * Contoh: data lama "keping" diseragamkan jadi "pcs".
 */
const SATUAN_ALIAS = {
  keping: "pcs",
  kepingan: "pcs",
};

export function normalizeSatuan(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  return SATUAN_ALIAS[raw] || raw;
}

