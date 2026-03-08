// ============================================
// FILE: src/controllers/logStokController.js
// FUNGSI: Daftar log perubahan stok (audit trail) — Admin only
// Input: query barangId?, dari?, sampai?, jenis?
// Output: { success, message, data: { list } }
// ============================================

import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

const VALID_JENIS = ['APPROVE', 'RESTOCK', 'PENYESUAIAN'];

/**
 * GET /api/log-stok
 * Tujuan: List log stok dengan filter (barang, periode, jenis).
 * Hanya ADMIN.
 */
export async function listLogStok(req, res) {
  try {
    const { barangId, dari, sampai, jenis } = req.query;
    const where = {};

    if (barangId?.trim()) where.barangId = barangId.trim();
    if (dari || sampai) {
      where.createdAt = {};
      if (dari) where.createdAt.gte = new Date(dari);
      if (sampai) {
        const s = new Date(sampai);
        s.setHours(23, 59, 59, 999);
        where.createdAt.lte = s;
      }
    }
    if (jenis && VALID_JENIS.includes(jenis)) where.jenis = jenis;

    const list = await prisma.logStok.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        barang: { select: { id: true, nama: true, satuan: true } },
        admin: { select: { id: true, nama: true } },
      },
    });
    return successResponse(res, 'Daftar log stok', { list });
  } catch (err) {
    console.error('List log stok error:', err);
    return errorResponse(res, 'Gagal mengambil log stok.', 500);
  }
}
