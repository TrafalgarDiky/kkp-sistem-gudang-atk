// ============================================
// FILE: src/controllers/adminController.js
// FUNGSI: Data ringkasan dashboard Admin (hanya ADMIN)
// Output: { totalPending, totalOnDelivery, stokMenipis, antrianPending, tugasAktif }
// ============================================

import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/admin/dashboard
 * Tujuan: Ringkasan untuk halaman Dashboard Admin.
 */
export async function getDashboard(req, res) {
  try {
    const [totalPending, totalOnDelivery, barangList, antrianPending, tugasAktif] = await Promise.all([
      prisma.permintaan.count({ where: { statusAdmin: 'PENDING_APPROVAL' } }),
      prisma.permintaan.count({ where: { statusAdmin: 'ON_DELIVERY' } }),
      prisma.barang.findMany({
        where: { stok: { not: null } },
        select: { id: true, nama: true, satuan: true, stok: true, stokMinimum: true },
      }),
      prisma.permintaan.findMany({
        where: { statusAdmin: 'PENDING_APPROVAL' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          peminta: { select: { nama: true } },
          items: { include: { barang: { select: { nama: true } } } },
        },
      }),
      prisma.tugasPetugas.findMany({
        where: { statusTugas: { in: ['MENUNGGU_ASSIGN', 'ON_DELIVERY'] } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          permintaan: {
            include: { peminta: { select: { nama: true } }, items: { include: { barang: { select: { nama: true } } } } },
          },
          petugas: { select: { nama: true } },
        },
      }),
    ]);

    const stokMenipis = barangList.filter((b) => b.stokMinimum != null && b.stok < b.stokMinimum);

    return successResponse(res, 'Data dashboard', {
      totalPending,
      totalOnDelivery,
      stokMenipis,
      antrianPending,
      tugasAktif,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return errorResponse(res, 'Gagal mengambil data dashboard.', 500);
  }
}
