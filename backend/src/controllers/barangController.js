import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/barang
 * Tujuan: Mengambil daftar semua barang ATK.
 * Akses: butuh login (role apa saja boleh melihat).
 */

export async function listBarang(req, res) {
    try {
        const barang = await prisma.barang.findMany({
            orderBy: { nama: 'asc' },
            select: {
                id: true,
                nama: true,
                deskripsi: true,
                satuan: true,
                stok: true,
                stokMinimum: true,
                gambarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return successResponse(res, 'Daftar barang', {barang});
    } catch (err) {
        console.error('List barang error:', err);
        return errorResponse(res, 'Gagal mengambil data barang.', 500);
    }
}

// Create barang
export async function createBarang(req, res) {
  try {
    const { nama, satuan, stok = 0, stokMinimum, deskripsi, gambarUrl } = req.body;

    // Validasi sederhana
    if (!nama?.trim()) {
      return errorResponse(res, 'Nama barang wajib diisi', 400);
    }
    if (!satuan?.trim()) {
      return errorResponse(res, 'Satuan barang wajib diisi', 400);
    }
    if (stok < 0) {
      return errorResponse(res, 'Stok barang tidak boleh negatif', 400);
    }

    const barang = await prisma.barang.create({
      data: {
        nama: nama.trim(),
        satuan: satuan.trim(),
        stok: Number(stok) || 0,
        stokMinimum: stokMinimum != null && stokMinimum !== '' ? Number(stokMinimum) : null,
        deskripsi: deskripsi?.trim() || null,
        gambarUrl: gambarUrl?.trim() || null,
      },
      select: {
        id: true,
        nama: true,
        deskripsi: true,
        satuan: true,
        stok: true,
        stokMinimum: true,
        gambarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(res, 'Barang berhasil dibuat', { barang }, 201);
  } catch (err) {
    console.error('Create barang error:', err);
    return errorResponse(res, 'Gagal membuat barang.', 500);
  }
}

/** GET /api/barang/:id — ambil satu barang by id */
export async function getBarangById(req, res) {
  try {
    const { id } = req.params;
    const barang = await prisma.barang.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        deskripsi: true,
        satuan: true,
        stok: true,
        stokMinimum: true,
        gambarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!barang) {
      return errorResponse(res, 'Barang tidak ditemukan', 404);
    }
    return successResponse(res, 'Detail barang', { barang });
  } catch (err) {
    console.error('Get barang by id error:', err);
    return errorResponse(res, 'Gagal mengambil data barang.', 500);
  }
}

/** PATCH /api/barang/:id — update barang (hanya ADMIN) */
export async function updateBarang(req, res) {
  try {
    const { id } = req.params;
    const { nama, satuan, stok, stokMinimum, deskripsi, gambarUrl } = req.body;

    const existing = await prisma.barang.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Barang tidak ditemukan', 404);
    }

    const data = {};
    if (nama !== undefined) data.nama = nama.trim();
    if (satuan !== undefined) data.satuan = satuan.trim();
    if (stok !== undefined) {
      if (Number(stok) < 0) {
        return errorResponse(res, 'Stok tidak boleh negatif', 400);
      }
      data.stok = Number(stok);
    }
    if (deskripsi !== undefined) data.deskripsi = deskripsi?.trim() || null;
    if (gambarUrl !== undefined) data.gambarUrl = gambarUrl?.trim() || null;
    if (stokMinimum !== undefined) data.stokMinimum = stokMinimum === '' || stokMinimum == null ? null : Number(stokMinimum);

    const barang = await prisma.barang.update({
      where: { id },
      data,
      select: {
        id: true,
        nama: true,
        deskripsi: true,
        satuan: true,
        stok: true,
        stokMinimum: true,
        gambarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return successResponse(res, 'Barang berhasil diupdate', { barang });
  } catch (err) {
    console.error('Update barang error:', err);
    return errorResponse(res, 'Gagal mengupdate barang.', 500);
  }
}

/** DELETE /api/barang/:id — hapus barang (hanya ADMIN) */
export async function deleteBarang(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.barang.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Barang tidak ditemukan', 404);
    }
    await prisma.barang.delete({ where: { id } });
    return successResponse(res, 'Barang berhasil dihapus');
  } catch (err) {
    console.error('Delete barang error:', err);
    return errorResponse(res, 'Gagal menghapus barang.', 500);
  }
}