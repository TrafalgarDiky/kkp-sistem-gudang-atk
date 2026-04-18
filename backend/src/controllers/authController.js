// ============================================
// FILE: src/controllers/authController.js
// FUNGSI: Logika bisnis untuk registrasi dan login
// Input: request body (nama, email, password, role)
// Output: response konsisten { success, message, data }
// ============================================

import { createHash, randomBytes } from 'node:crypto';
import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../utils/sendMail.js';

const RESET_PASSWORD_EXPIRY_MS = 60 * 60 * 1000;

// Role yang boleh dipilih saat registrasi (enum di schema)
const VALID_ROLES = ['STAFF', 'ADMIN', 'PETUGAS'];

/**
 * POST /api/auth/register
 * Input: { nama, email, password, role? }
 * - role opsional; default STAFF. Admin nanti verifikasi akun.
 */
export async function register(req, res) {
  try {
    const { nama, email, divisi, password, role = 'STAFF' } = req.body;

    // Validasi input wajib
    if (!nama?.trim()) {
      return errorResponse(res, 'Nama wajib diisi', 400);
    }
    if (!email?.trim()) {
      return errorResponse(res, 'Email wajib diisi', 400);
    }
    if (!divisi?.trim()) {
      return errorResponse(res, 'Divisi wajib diisi', 400);
    }
    if (!password || password.length < 6) {
      return errorResponse(res, 'Password minimal 6 karakter', 400);
    }
    if (!VALID_ROLES.includes(role)) {
      return errorResponse(res, 'Role tidak valid. Pilih: STAFF, ADMIN, atau PETUGAS', 400);
    }

    // Cek email sudah dipakai atau belum
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existing) {
      return errorResponse(res, 'Email sudah terdaftar', 409);
    }

    // Hash password lalu simpan user (status BELUM_VERIFIKASI)
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        divisi: divisi.trim(),
        passwordHash,
        role,
        statusAkun: 'BELUM_VERIFIKASI'
      },
      select: {
        id: true,
        nama: true,
        email: true,
        divisi: true,
        role: true,
        statusAkun: true,
        createdAt: true
      }
    });

    return successResponse(res, 'Registrasi berhasil. Menunggu verifikasi admin.', { user }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return errorResponse(res, 'Gagal registrasi. Coba lagi.', 500);
  }
}

/**
 * POST /api/auth/login
 * Input: { email, password }
 * Output: { token, user } — hanya jika statusAkun = AKTIF (sudah diverifikasi)
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return errorResponse(res, 'Email dan password wajib diisi', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (!user) {
      return errorResponse(res, 'Email atau password salah', 401);
    }

    const passwordOk = await comparePassword(password, user.passwordHash);
    if (!passwordOk) {
      return errorResponse(res, 'Email atau password salah', 401);
    }

    // Hanya yang sudah diverifikasi yang boleh login
    if (user.statusAkun !== 'AKTIF') {
      return errorResponse(res, 'Akun belum diverifikasi oleh admin', 403);
    }

    const token = signToken(user.id, user.email, user.role);
    const userData = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      divisi: user.divisi,
      role: user.role,
      statusAkun: user.statusAkun
    };

    return successResponse(res, 'Login berhasil', { token, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 'Gagal login. Coba lagi.', 500);
  }
}

/**
 * GET /api/auth/me
 * Tujuan: ambil profil user yang sedang login.
 */
export async function getMe(req, res) {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        email: true,
        divisi: true,
        role: true,
        statusAkun: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) return errorResponse(res, "User tidak ditemukan", 404);
    return successResponse(res, "Profil user", { user });
  } catch (err) {
    console.error("getMe error:", err);
    const detail =
      process.env.NODE_ENV === "development" ? ` (${err?.message || "unknown"})` : "";
    return errorResponse(res, `Gagal mengambil profil.${detail}`, 500);
  }
}

/**
 * PATCH /api/auth/me
 * Tujuan: user update profil sendiri (nama, email, divisi).
 * Body: { nama?, email?, divisi? }
 */
export async function updateMe(req, res) {
  try {
    const userId = req.user?.userId;
    const { nama, email, divisi } = req.body || {};

    const data = {};
    if (nama !== undefined) {
      const n = String(nama || "").trim();
      if (!n) return errorResponse(res, "Nama wajib diisi", 400);
      data.nama = n;
    }
    if (email !== undefined) {
      const e = String(email || "").trim().toLowerCase();
      if (!e || !e.includes("@")) return errorResponse(res, "Email tidak valid", 400);
      // pastikan email unik
      const existing = await prisma.user.findUnique({ where: { email: e } });
      if (existing && existing.id !== userId) {
        return errorResponse(res, "Email sudah digunakan user lain", 409);
      }
      data.email = e;
    }
    if (divisi !== undefined) {
      const d = String(divisi || "").trim();
      data.divisi = d ? d : null;
    }

    if (Object.keys(data).length === 0) {
      return errorResponse(res, "Berikan minimal satu field: nama, email, atau divisi", 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        nama: true,
        email: true,
        divisi: true,
        role: true,
        statusAkun: true,
        updatedAt: true,
      },
    });
    return successResponse(res, "Profil berhasil diupdate", { user: updated });
  } catch (err) {
    console.error("updateMe error:", err);
    const detail =
      process.env.NODE_ENV === "development" ? ` (${err?.message || "unknown"})` : "";
    return errorResponse(res, `Gagal update profil.${detail}`, 500);
  }
}

/**
 * PATCH /api/auth/me/password
 * Tujuan: user mengganti password sendiri (self-service) saat sudah login.
 * Body: { passwordLama, passwordBaru }
 *
 * Alur:
 * 1. Ambil user dari DB berdasar req.user.userId (dari JWT).
 * 2. Verifikasi passwordLama cocok dengan passwordHash di DB.
 * 3. Hash passwordBaru, simpan.
 */
export async function changeMyPassword(req, res) {
  try {
    const userId = req.user?.userId;
    const { passwordLama, passwordBaru } = req.body || {};

    if (!passwordLama || typeof passwordLama !== "string") {
      return errorResponse(res, "Password lama wajib diisi", 400);
    }
    if (!passwordBaru || typeof passwordBaru !== "string" || passwordBaru.length < 6) {
      return errorResponse(res, "Password baru minimal 6 karakter", 400);
    }
    if (passwordLama === passwordBaru) {
      return errorResponse(res, "Password baru harus berbeda dari password lama", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return errorResponse(res, "User tidak ditemukan", 404);

    const ok = await comparePassword(passwordLama, user.passwordHash);
    if (!ok) return errorResponse(res, "Password lama salah", 401);

    const newHash = await hashPassword(passwordBaru);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return successResponse(res, "Password berhasil diubah. Silakan login ulang jika diminta.");
  } catch (err) {
    console.error("changeMyPassword error:", err);
    return errorResponse(res, "Gagal mengubah password.", 500);
  }
}

/**
 * PATCH /api/auth/users/:id/verify
 * Hanya ADMIN. Set status user jadi AKTIF atau DITOLAK.
 * Body: { status: 'AKTIF' | 'DITOLAK' }
 */
export async function verifyUser(req, res) {
  try {
    const { id: userId } = req.params;
    const { status } = req.body;

    if (!['AKTIF', 'DITOLAK'].includes(status)) {
      return errorResponse(res, 'Status harus AKTIF atau DITOLAK', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { statusAkun: status },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        statusAkun: true,
        updatedAt: true
      }
    });

    return successResponse(
      res,
      status === 'AKTIF' ? 'User berhasil diverifikasi (aktif).' : 'User ditolak.',
      { user: updated }
    );
  } catch (err) {
    console.error('Verify user error:', err);
    return errorResponse(res, 'Gagal memperbarui status user.', 500);
  }
}

/**
 * GET /api/auth/pending
 * Hanya ADMIN. Daftar user yang status BELUM_VERIFIKASI (untuk halaman verifikasi).
 */
export async function listPendingUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { statusAkun: 'BELUM_VERIFIKASI' },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        statusAkun: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, 'Daftar user menunggu verifikasi', { users });
  } catch (err) {
    console.error('List pending users error:', err);
    return errorResponse(res, 'Gagal mengambil data.', 500);
  }
}

/**
 * GET /api/auth/users
 * Hanya ADMIN. Daftar semua user (untuk menu User & Role).
 */
export async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        divisi: true,
        role: true,
        statusAkun: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, 'Daftar semua user', { users });
  } catch (err) {
    console.error('List users error:', err);
    return errorResponse(res, 'Gagal mengambil daftar user.', 500);
  }
}

/**
 * PATCH /api/auth/users/:id
 * Hanya ADMIN. Update user: role dan/atau statusAkun.
 * Body: { role?: 'STAFF'|'ADMIN'|'PETUGAS', statusAkun?: 'AKTIF'|'DITOLAK'|'BELUM_VERIFIKASI' }
 */
export async function updateUser(req, res) {
  try {
    const { id: userId } = req.params;
    const { role, statusAkun } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    const data = {};
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return errorResponse(res, 'Role tidak valid. Pilih: STAFF, ADMIN, atau PETUGAS', 400);
      }
      data.role = role;
    }
    if (statusAkun !== undefined) {
      if (!['AKTIF', 'DITOLAK', 'BELUM_VERIFIKASI'].includes(statusAkun)) {
        return errorResponse(res, 'statusAkun harus AKTIF, DITOLAK, atau BELUM_VERIFIKASI', 400);
      }
      data.statusAkun = statusAkun;
    }

    if (Object.keys(data).length === 0) {
      return errorResponse(res, 'Berikan minimal satu field: role atau statusAkun', 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        statusAkun: true,
        updatedAt: true,
      },
    });
    return successResponse(res, 'User berhasil diupdate', { user: updated });
  } catch (err) {
    console.error('Update user error:', err);
    return errorResponse(res, 'Gagal memperbarui user.', 500);
  }
}

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Selalu respons sama (tidak membocorkan apakah email terdaftar).
 */
export async function forgotPassword(req, res) {
  const genericMsg =
    'Jika email terdaftar, instruksi reset password telah dikirim. Periksa inbox atau folder spam.';
  try {
    const email = req.body?.email?.trim()?.toLowerCase();
    if (!email) {
      return errorResponse(res, 'Email wajib diisi', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return successResponse(res, genericMsg);
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + RESET_PASSWORD_EXPIRY_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires,
      },
    });

    const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${base}/reset-password?token=${rawToken}`;

    const { sent, reason } = await sendPasswordResetEmail(user.email, resetUrl);
    if (!sent && reason === 'no_smtp' && process.env.NODE_ENV !== 'development') {
      console.warn('[forgot-password] SMTP tidak dikonfigurasi — email tidak terkirim.');
    }

    return successResponse(res, genericMsg);
  } catch (err) {
    console.error('forgotPassword error:', err);
    const msg = String(err?.message || '');
    const code = err?.code;
    if (
      code === 'P2022' ||
      msg.includes('reset_password') ||
      msg.includes('does not exist') ||
      msg.includes('Unknown arg')
    ) {
      console.error(
        '[forgot-password] Database belum punya kolom reset password. Jalankan di folder backend: npx prisma db push && npx prisma generate'
      );
    }
    return errorResponse(res, 'Gagal memproses permintaan.', 500);
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
export async function resetPasswordWithToken(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || typeof token !== 'string' || !token.trim()) {
      return errorResponse(res, 'Token tidak valid.', 400);
    }
    if (!password || password.length < 6) {
      return errorResponse(res, 'Password minimal 6 karakter.', 400);
    }

    const tokenHash = createHash('sha256').update(token.trim()).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return errorResponse(
        res,
        'Tautan tidak valid atau sudah kadaluarsa. Minta reset password lagi dari halaman login.',
        400
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return successResponse(res, 'Password berhasil diubah. Silakan login dengan password baru.');
  } catch (err) {
    console.error('resetPasswordWithToken error:', err);
    return errorResponse(res, 'Gagal mengubah password.', 500);
  }
}
