// ============================================
// FILE: src/controllers/authController.js
// FUNGSI: Logika bisnis untuk registrasi dan login
// Input: request body (nama, email, password, role)
// Output: response konsisten { success, message, data }
// ============================================

import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

// Role yang boleh dipilih saat registrasi (enum di schema)
const VALID_ROLES = ['STAFF', 'ADMIN', 'PETUGAS'];

/**
 * POST /api/auth/register
 * Input: { nama, email, password, role? }
 * - role opsional; default STAFF. Admin nanti verifikasi akun.
 */
export async function register(req, res) {
  try {
    const { nama, email, password, role = 'STAFF' } = req.body;

    // Validasi input wajib
    if (!nama?.trim()) {
      return errorResponse(res, 'Nama wajib diisi', 400);
    }
    if (!email?.trim()) {
      return errorResponse(res, 'Email wajib diisi', 400);
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
        passwordHash,
        role,
        statusAkun: 'BELUM_VERIFIKASI'
      },
      select: {
        id: true,
        nama: true,
        email: true,
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
