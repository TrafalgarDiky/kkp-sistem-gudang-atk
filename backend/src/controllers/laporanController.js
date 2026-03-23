// ============================================
// FILE: src/controllers/laporanController.js
// FUNGSI: Laporan rekap permintaan & pemakaian — Admin only
// Input: query dari?, sampai?
// Output: { success, message, data }
// ============================================

import prisma from "../config/database.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * GET /api/laporan
 * Tujuan: Rekap permintaan per periode + pemakaian per barang (dari permintaan selesai).
 * Hanya ADMIN.
 */
export async function getLaporan(req, res) {
  try {
    const { dari, sampai } = req.query;
    const wherePermintaan = { statusAdmin: "SELESAI" };
    if (dari || sampai) {
      wherePermintaan.updatedAt = {};
      if (dari) wherePermintaan.updatedAt.gte = new Date(dari);
      if (sampai) {
        const s = new Date(sampai);
        s.setHours(23, 59, 59, 999);
        wherePermintaan.updatedAt.lte = s;
      }
    }

    const permintaan = await prisma.permintaan.findMany({
      where: wherePermintaan,
      orderBy: { updatedAt: "desc" },
      include: {
        peminta: { select: { nama: true } },
        items: {
          include: { barang: { select: { nama: true, satuan: true } } },
        },
      },
    });

    // Pemakaian per barang (agregasi dari items permintaan selesai)
    const pemakaianByBarang = {};
    for (const p of permintaan) {
      for (const item of p.items) {
        const key = item.barangId;
        if (!pemakaianByBarang[key]) {
          pemakaianByBarang[key] = {
            barangId: item.barangId,
            namaBarang: item.barang?.nama ?? "-",
            satuan: item.barang?.satuan ?? "-",
            totalQty: 0,
          };
        }
        pemakaianByBarang[key].totalQty += item.jumlah;
      }
    }
    const pemakaian = Object.values(pemakaianByBarang).sort(
      (a, b) => b.totalQty - a.totalQty,
    );

    return successResponse(res, "Laporan rekap", {
      permintaan,
      pemakaian,
      totalPermintaan: permintaan.length,
    });
  } catch (err) {
    console.error("Laporan error:", err);
    return errorResponse(res, "Gagal mengambil laporan.", 500);
  }
}
