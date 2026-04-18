// ============================================
// FILE: src/controllers/laporanController.js
// FUNGSI: Laporan agregat (KPI + ranking) — Admin only
// Input : query dari?, sampai?
// Output: { success, message, data: {
//   periode: { dari, sampai },
//   total: { qtyMasuk, qtyKeluar, restock, permintaan },
//   topPemasukan: [{ barangId, namaBarang, satuan, totalQty }],
//   topPengeluaran: [{ barangId, namaBarang, satuan, totalQty }],
//   topPengguna: [{ userId, nama, divisi, totalPermintaan, totalQty }]
// }}
// ============================================

import prisma from "../config/database.js";
import { successResponse, errorResponse } from "../utils/response.js";

const LIMIT_TOP = 10;
const LIMIT_TOP_USER = 5;

/**
 * Bangun where clause periode untuk field tertentu (createdAt / updatedAt / tanggal).
 * Mengembalikan {} kalau dari & sampai sama-sama kosong.
 */
function buildPeriodeWhere(field, dari, sampai) {
  if (!dari && !sampai) return {};
  const cond = {};
  if (dari) cond.gte = new Date(dari);
  if (sampai) {
    const s = new Date(sampai);
    s.setHours(23, 59, 59, 999);
    cond.lte = s;
  }
  return { [field]: cond };
}

/**
 * GET /api/laporan
 * Tujuan : agregat laporan untuk dashboard manajemen.
 * Hanya ADMIN (sudah di-guard middleware route).
 */
export async function getLaporan(req, res) {
  try {
    const { dari, sampai } = req.query;

    // ===== 1) STOK MASUK (barang masuk / restock) di periode =====
    const wherePemasukan = buildPeriodeWhere("tanggal", dari, sampai);
    const pemasukanList = await prisma.stokMasuk.findMany({
      where: wherePemasukan,
      include: { barang: { select: { id: true, nama: true, satuan: true } } },
    });

    // Agregat top barang masuk
    const pemasukanByBarang = {};
    let totalQtyMasuk = 0;
    for (const r of pemasukanList) {
      const qty = Number(r.jumlah) || 0;
      totalQtyMasuk += qty;
      const key = r.barangId;
      if (!pemasukanByBarang[key]) {
        pemasukanByBarang[key] = {
          barangId: key,
          namaBarang: r.barang?.nama ?? "-",
          satuan: r.barang?.satuan ?? "-",
          totalQty: 0,
        };
      }
      pemasukanByBarang[key].totalQty += qty;
    }
    const topPemasukan = Object.values(pemasukanByBarang)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, LIMIT_TOP);

    // ===== 2) PERMINTAAN SELESAI (pengeluaran) di periode =====
    const wherePermintaan = {
      statusAdmin: "SELESAI",
      ...buildPeriodeWhere("updatedAt", dari, sampai),
    };

    const permintaan = await prisma.permintaan.findMany({
      where: wherePermintaan,
      include: {
        peminta: { select: { id: true, nama: true, divisi: true } },
        items: {
          include: { barang: { select: { id: true, nama: true, satuan: true } } },
        },
      },
    });

    // Agregat top barang keluar + top pengguna
    const pengeluaranByBarang = {};
    const penggunaMap = {};
    let totalQtyKeluar = 0;

    for (const p of permintaan) {
      const userId = p.peminta?.id;
      if (userId && !penggunaMap[userId]) {
        penggunaMap[userId] = {
          userId,
          nama: p.peminta?.nama ?? "-",
          divisi: p.peminta?.divisi ?? null,
          totalPermintaan: 0,
          totalQty: 0,
        };
      }
      if (userId) penggunaMap[userId].totalPermintaan += 1;

      for (const item of p.items) {
        const qty = Number(item.jumlah) || 0;
        totalQtyKeluar += qty;
        const key = item.barangId;
        if (!pengeluaranByBarang[key]) {
          pengeluaranByBarang[key] = {
            barangId: key,
            namaBarang: item.barang?.nama ?? "-",
            satuan: item.barang?.satuan ?? "-",
            totalQty: 0,
          };
        }
        pengeluaranByBarang[key].totalQty += qty;
        if (userId) penggunaMap[userId].totalQty += qty;
      }
    }

    const topPengeluaran = Object.values(pengeluaranByBarang)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, LIMIT_TOP);

    const topPengguna = Object.values(penggunaMap)
      .sort((a, b) => b.totalPermintaan - a.totalPermintaan || b.totalQty - a.totalQty)
      .slice(0, LIMIT_TOP_USER);

    return successResponse(res, "Laporan agregat", {
      periode: { dari: dari || null, sampai: sampai || null },
      total: {
        qtyMasuk: totalQtyMasuk,
        qtyKeluar: totalQtyKeluar,
        restock: pemasukanList.length,
        permintaan: permintaan.length,
      },
      topPemasukan,
      topPengeluaran,
      topPengguna,
    });
  } catch (err) {
    console.error("Laporan error:", err);
    return errorResponse(res, "Gagal mengambil laporan.", 500);
  }
}
