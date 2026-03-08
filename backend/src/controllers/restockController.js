// ============================================
// FILE: src/controllers/restockController.js
// FUNGSI: Restock barang (stok masuk) — Admin only
// Input: body { barangId, jumlah, sumber?, tanggal? }
// Output: { success, message, data }
// ============================================

import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { randomUUID } from 'crypto';

/**
 * POST /api/restock
 * Tujuan: Catat stok masuk (restock), update stok barang, tulis LogStok.
 * Hanya ADMIN.
 */
export async function createRestock(req, res) {
  try {
    const adminId = req.user.userId;
    const { barangId, jumlah, sumber, tanggal } = req.body;

    if (!barangId?.trim()) {
      return errorResponse(res, 'barangId wajib diisi', 400);
    }
    const numJumlah = Number(jumlah);
    if (!Number.isInteger(numJumlah) || numJumlah <= 0) {
      return errorResponse(res, 'jumlah harus bilangan bulat positif', 400);
    }

    const barang = await prisma.barang.findUnique({ where: { id: barangId.trim() } });
    if (!barang) {
      return errorResponse(res, 'Barang tidak ditemukan', 404);
    }

    const tanggalMasuk = tanggal ? new Date(tanggal) : new Date();
    if (isNaN(tanggalMasuk.getTime())) {
      return errorResponse(res, 'Format tanggal tidak valid', 400);
    }

    const id = randomUUID();
    await prisma.$transaction(async (tx) => {
      await tx.stokMasuk.create({
        data: {
          id,
          barangId: barang.id,
          jumlah: numJumlah,
          sumber: sumber?.trim() || null,
          tanggal: tanggalMasuk,
          adminId,
        },
      });
      await tx.barang.update({
        where: { id: barang.id },
        data: { stok: { increment: numJumlah } },
      });
      await tx.logStok.create({
        data: {
          barangId: barang.id,
          perubahan: numJumlah,
          jenis: 'RESTOCK',
          referensiId: id,
          adminId,
        },
      });
    });

    const stokMasuk = await prisma.stokMasuk.findUnique({
      where: { id },
      include: {
        barang: { select: { id: true, nama: true, satuan: true, stok: true } },
        admin: { select: { id: true, nama: true } },
      },
    });

    return successResponse(res, 'Restock berhasil dicatat', { stokMasuk }, 201);
  } catch (err) {
    console.error('Create restock error:', err);
    return errorResponse(res, 'Gagal mencatat restock.', 500);
  }
}

/**
 * GET /api/restock
 * Tujuan: Riwayat stok masuk (restock) dengan filter opsional barangId.
 * Hanya ADMIN.
 */
export async function listRestock(req, res) {
  try {
    const { barangId } = req.query;
    const where = {};
    if (barangId?.trim()) where.barangId = barangId.trim();

    const list = await prisma.stokMasuk.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        barang: { select: { id: true, nama: true, satuan: true } },
        admin: { select: { id: true, nama: true } },
      },
    });
    return successResponse(res, 'Riwayat restock', { list });
  } catch (err) {
    console.error('List restock error:', err);
    return errorResponse(res, 'Gagal mengambil riwayat restock.', 500);
  }
}
