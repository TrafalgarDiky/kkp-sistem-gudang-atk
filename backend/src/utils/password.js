// ============================================
// FILE: src/utils/password.js
// FUNGSI: Hash dan cek password (pakai bcrypt)
// Tujuan: Password tidak disimpan plain text, hanya hash-nya
// ============================================

import bcrypt from 'bcryptjs';

// Jumlah "rounds" untuk hash — makin besar makin aman tapi lebih lambat
const SALT_ROUNDS = 10;

/**
 * Hash password sebelum disimpan ke database.
 * @param {string} plainPassword - password asli dari user
 * @returns {Promise<string>} password yang sudah di-hash
 */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Bandingkan password dari form login dengan hash di database.
 * @param {string} plainPassword - password yang diketik user
 * @param {string} hashedPassword - hash dari database
 * @returns {Promise<boolean>} true jika cocok
 */
export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}
