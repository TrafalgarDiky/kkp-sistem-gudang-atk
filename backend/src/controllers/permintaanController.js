import prisma from "../config/database.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { notifyPetugasTugasBaru } from "../services/pushNotification.js";

/** Kode permintaan manusiawi: P-0001, P-0042, … (huruf P = permintaan; angka 4 digit seperti kode barang A-0001). */
function formatKodePermintaan(urut) {
  return `P-${String(urut).padStart(4, "0")}`;
}

/** Urutan berikutnya dari kode P-xxxx yang sudah ada (sama ide dengan generateNextKodeBarang). */
async function generateNextKodePermintaan(tx) {
  const last = await tx.permintaan.findFirst({
    where: { kode: { not: null } },
    orderBy: { kode: "desc" },
    select: { kode: true },
  });
  if (!last?.kode) {
    return formatKodePermintaan(1);
  }
  const match = last.kode.match(/^P-(\d+)$/);
  const lastNum = match ? Number(match[1]) : 0;
  return formatKodePermintaan(lastNum + 1);
}

/** GET /api/permintaan — list permintaan (Staff: punya sendiri, Admin/Petugas: semua) */
export async function listPermintaan(req, res) {
  try {
    const { role, userId } = req.user;
    const { status } = req.query;

    const where = {};
    if (role === "STAFF") where.pemintaId = userId;
    if (status) where.statusAdmin = status;

    const permintaan = await prisma.permintaan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        peminta: { select: { id: true, nama: true, email: true, divisi: true } },
        approver: { select: { id: true, nama: true } },
        items: {
          include: {
            barang: { select: { id: true, nama: true, satuan: true } },
          },
        },
        tugasPetugas: {
          include: { petugas: { select: { id: true, nama: true } } },
        },
      },
    });
    return successResponse(res, "Daftar permintaan", { permintaan });
  } catch (err) {
    console.error("List permintaan error:", err);
    return errorResponse(res, "Gagal mengambil daftar permintaan.", 500);
  }
}

/** GET /api/permintaan/:id — detail satu permintaan */
export async function getPermintaanById(req, res) {
  try {
    const { id } = req.params;
    const permintaan = await prisma.permintaan.findUnique({
      where: { id },
      include: {
        peminta: { select: { id: true, nama: true, email: true, divisi: true } },
        approver: { select: { id: true, nama: true } },
        items: {
          include: {
            barang: {
              select: { id: true, nama: true, satuan: true, stok: true, gambarUrl: true },
            },
          },
        },
        tugasPetugas: true,
      },
    });
    if (!permintaan)
      return errorResponse(res, "Permintaan tidak ditemukan", 404);
    return successResponse(res, "Detail permintaan", { permintaan });
  } catch (err) {
    console.error("Get permintaan error:", err);
    return errorResponse(res, "Gagal mengambil data permintaan.", 500);
  }
}

/** POST /api/permintaan — Staff buat permintaan (items: [{ barangId, jumlah }]) */
export async function createPermintaan(req, res) {
  try {
    const userId = req.user.userId;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(
        res,
        "Minimal satu item barang (barangId + jumlah)",
        400,
      );
    }

    for (const it of items) {
      if (!it.barangId || !it.jumlah || it.jumlah < 1) {
        return errorResponse(
          res,
          "Setiap item harus punya barangId dan jumlah > 0",
          400,
        );
      }
    }

    const barangIds = items.map((i) => i.barangId);
    const barangs = await prisma.barang.findMany({
      where: { id: { in: barangIds } },
    });
    if (barangs.length !== barangIds.length) {
      return errorResponse(res, "Ada barangId yang tidak valid", 400);
    }

    const permintaan = await prisma.$transaction(async (tx) => {
      const kode = await generateNextKodePermintaan(tx);

      const p = await tx.permintaan.create({
        // Auto-approve: langsung siap diambil petugas tanpa approval admin
        data: {
          pemintaId: userId,
          kode,
          statusAdmin: "DISETUJUI_ADMIN",
          approvedAt: new Date(),
          catatanAdmin: "Auto-approve sistem",
        },
      });
      await tx.permintaanItem.createMany({
        data: items.map((it) => ({
          permintaanId: p.id,
          barangId: it.barangId,
          jumlah: Number(it.jumlah),
        })),
      });
      await tx.tugasPetugas.create({
        data: {
          permintaanId: p.id,
          statusTugas: "MENUNGGU_ASSIGN",
          dibuatOtomatis: true,
        },
      });
      return tx.permintaan.findUnique({
        where: { id: p.id },
        include: {
          items: {
            include: {
              barang: { select: { id: true, nama: true, satuan: true } },
            },
          },
        },
      });
    });

    await notifyPetugasTugasBaru(permintaan);

    return successResponse(
      res,
      "Permintaan berhasil dibuat dan langsung masuk ke tugas petugas",
      { permintaan },
      201,
    );
  } catch (err) {
    console.error("Create permintaan error:", err);
    return errorResponse(res, "Gagal membuat permintaan.", 500);
  }
}

/** PATCH /api/permintaan/:id/approve — Admin setujui/tolak */
export async function approvePermintaan(req, res) {
  try {
    const { id } = req.params;
    const { status, catatanAdmin } = req.body;
    const adminId = req.user.userId;

    if (!["DISETUJUI_ADMIN", "DITOLAK_ADMIN"].includes(status)) {
      return errorResponse(
        res,
        "Status harus DISETUJUI_ADMIN atau DITOLAK_ADMIN",
        400,
      );
    }

    const permintaan = await prisma.permintaan.findUnique({ where: { id } });
    if (!permintaan)
      return errorResponse(res, "Permintaan tidak ditemukan", 404);
    /**
     * Sistem sekarang bisa auto-approve (status awal DISETUJUI_ADMIN).
     * Admin tetap boleh MENOLAK sebelum permintaan selesai.
     */
    if (status === "DITOLAK_ADMIN") {
      if (permintaan.statusAdmin === "SELESAI") {
        return errorResponse(res, "Permintaan sudah selesai, tidak bisa ditolak", 400);
      }
      if (permintaan.statusAdmin === "DITOLAK_ADMIN") {
        return errorResponse(res, "Permintaan sudah ditolak", 400);
      }
      const alasan = String(catatanAdmin || "").trim();
      if (!alasan) {
        return errorResponse(res, "Alasan penolakan wajib diisi", 400);
      }
    } else {
      // DISETUJUI_ADMIN via approval manual hanya boleh dari MENUNGGU_ADMIN
      if (permintaan.statusAdmin !== "MENUNGGU_ADMIN") {
        return errorResponse(res, "Permintaan ini sudah diproses", 400);
      }
    }

    const updated = await prisma.permintaan.update({
      where: { id },
      data: {
        statusAdmin: status,
        approvedBy: adminId,
        approvedAt: new Date(),
        catatanAdmin: catatanAdmin?.trim() || null,
      },
      include: {
        peminta: { select: { id: true, nama: true, email: true, divisi: true } },
        approver: { select: { id: true, nama: true } },
        items: {
          include: {
            barang: { select: { id: true, nama: true, satuan: true } },
          },
        },
        tugasPetugas: {
          include: { petugas: { select: { id: true, nama: true } } },
        },
      },
    });

    if (status === "DITOLAK_ADMIN") {
      try {
        await prisma.tugasPetugas.updateMany({
          where: { permintaanId: id },
          data: { statusTugas: "DITOLAK" },
        });
      } catch (errTugas) {
        console.warn("Update tugas ke DITOLAK gagal:", errTugas?.message);
      }
    }
    if (status === "DISETUJUI_ADMIN") {
      try {
        await prisma.tugasPetugas.updateMany({
          where: { permintaanId: id },
          data: { statusTugas: "MENUNGGU_ASSIGN" },
        });
      } catch (errTugas) {
        console.warn(
          "Update tugas ke MENUNGGU_ASSIGN gagal:",
          errTugas?.message,
        );
      }
      await notifyPetugasTugasBaru(updated);
    }

    return successResponse(
      res,
      status === "DISETUJUI_ADMIN"
        ? "Permintaan disetujui"
        : "Permintaan ditolak",
      { permintaan: updated },
    );
  } catch (err) {
    console.error("Approve permintaan error:", err);
    return errorResponse(res, "Gagal memproses permintaan.", 500);
  }
}

/** PATCH /api/permintaan/:id/batal — Staff batalkan permintaan sendiri (sebelum diproses petugas) */
export async function batalPermintaan(req, res) {
  try {
    const { id } = req.params;
    const staffId = req.user.userId;

    const [permintaan, staff] = await Promise.all([
      prisma.permintaan.findUnique({
        where: { id },
        include: { tugasPetugas: true },
      }),
      prisma.user.findUnique({ where: { id: staffId }, select: { nama: true } }),
    ]);

    if (!permintaan) return errorResponse(res, "Permintaan tidak ditemukan", 404);
    if (permintaan.pemintaId !== staffId) {
      return errorResponse(res, "Anda hanya bisa membatalkan permintaan milik sendiri", 403);
    }
    if (["SELESAI", "DITOLAK_ADMIN"].includes(permintaan.statusAdmin)) {
      return errorResponse(res, "Permintaan ini tidak bisa dibatalkan", 400);
    }

    const tugasAktif = permintaan.tugasPetugas?.[0] || null;
    if (
      tugasAktif?.petugasId ||
      ["ON_DELIVERY", "DALAM_PROSES", "SELESAI", "DELIVERED"].includes(tugasAktif?.statusTugas)
    ) {
      return errorResponse(res, "Permintaan sudah diproses petugas dan tidak bisa dibatalkan", 400);
    }

    const namaStaff = staff?.nama || "Tanpa Nama";
    const catatanBatal = `Dibatalkan oleh staff ${namaStaff}`;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.tugasPetugas.updateMany({
        where: { permintaanId: id },
        data: { statusTugas: "DITOLAK" },
      });
      return tx.permintaan.update({
        where: { id },
        data: {
          statusAdmin: "DITOLAK_ADMIN",
          catatanAdmin: catatanBatal,
          approvedAt: new Date(),
        },
        include: {
          peminta: { select: { id: true, nama: true, email: true, divisi: true } },
          approver: { select: { id: true, nama: true } },
          items: { include: { barang: { select: { id: true, nama: true, satuan: true } } } },
          tugasPetugas: { include: { petugas: { select: { id: true, nama: true } } } },
        },
      });
    });

    return successResponse(res, "Permintaan berhasil dibatalkan", { permintaan: updated });
  } catch (err) {
    console.error("Batal permintaan error:", err);
    return errorResponse(res, "Gagal membatalkan permintaan.", 500);
  }
}

/** PATCH /api/permintaan/tugas/:id/ambil — Petugas ambil tugas (hanya yang belum diambil) */
export async function ambilTugas(req, res) {
  try {
    const { id: tugasId } = req.params;
    const petugasId = req.user.userId;

    const tugas = await prisma.tugasPetugas.findUnique({
      where: { id: tugasId },
      include: {
        permintaan: { include: { items: { include: { barang: true } } } },
      },
    });
    if (!tugas) return errorResponse(res, "Tugas tidak ditemukan", 404);
    if (["DITOLAK_ADMIN", "SELESAI"].includes(tugas.permintaan?.statusAdmin)) {
      return errorResponse(
        res,
        "Permintaan sudah ditolak atau sudah selesai",
        400,
      );
    }
    if (tugas.statusTugas === "DITOLAK") {
      return errorResponse(res, "Permintaan ditolak admin", 400);
    }
    if (tugas.statusTugas === "SELESAI" || tugas.statusTugas === "DELIVERED") {
      return errorResponse(res, "Tugas sudah selesai", 400);
    }
    if (tugas.petugasId && tugas.petugasId !== petugasId) {
      return errorResponse(res, "Tugas sedang diambil petugas lain", 400);
    }
    if (tugas.petugasId === petugasId) {
      return errorResponse(res, "Anda sudah mengambil tugas ini", 400);
    }

    const updated = await prisma.tugasPetugas.update({
      where: { id: tugasId },
      data: { petugasId, statusTugas: "ON_DELIVERY" },
      include: {
        permintaan: {
          include: {
            peminta: { select: { id: true, nama: true, email: true, divisi: true } },
            items: {
              include: {
                barang: {
                  select: { id: true, nama: true, satuan: true, gambarUrl: true },
                },
              },
            },
          },
        },
        petugas: { select: { id: true, nama: true } },
      },
    });
    return successResponse(res, "Tugas diambil", { tugas: updated });
  } catch (err) {
    console.error("Ambil tugas error:", err);
    return errorResponse(res, "Gagal mengambil tugas.", 500);
  }
}

/** PATCH /api/permintaan/tugas/:id/lepas — Petugas lepas tugas (hanya yang mengambil yang bisa lepas) */
export async function lepasTugas(req, res) {
  try {
    const { id: tugasId } = req.params;
    const petugasId = req.user.userId;

    const tugas = await prisma.tugasPetugas.findUnique({
      where: { id: tugasId },
      include: { permintaan: true },
    });
    if (!tugas) return errorResponse(res, "Tugas tidak ditemukan", 404);
    if (tugas.petugasId !== petugasId) {
      return errorResponse(
        res,
        "Hanya petugas yang mengambil tugas yang bisa melepas",
        400,
      );
    }
    if (tugas.statusTugas === "SELESAI" || tugas.statusTugas === "DELIVERED") {
      return errorResponse(res, "Tugas sudah selesai", 400);
    }

    const updated = await prisma.tugasPetugas.update({
      where: { id: tugasId },
      data: { petugasId: null, statusTugas: "MENUNGGU_ASSIGN" },
      include: {
        permintaan: {
          include: {
            peminta: { select: { id: true, nama: true, email: true, divisi: true } },
            items: {
              include: {
                barang: {
                  select: { id: true, nama: true, satuan: true, gambarUrl: true },
                },
              },
            },
          },
        },
        petugas: { select: { id: true, nama: true } },
      },
    });
    return successResponse(res, "Tugas dilepas", { tugas: updated });
  } catch (err) {
    console.error("Lepas tugas error:", err);
    return errorResponse(res, "Gagal melepas tugas.", 500);
  }
}

/** GET /api/permintaan/tugas — daftar tugas untuk Petugas (dan Admin) */
export async function listTugasPetugas(req, res) {
  try {
    const { statusTugas } = req.query;

    const where = {};
    if (statusTugas) where.statusTugas = statusTugas;

    const tugas = await prisma.tugasPetugas.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        permintaan: {
          include: {
            peminta: { select: { id: true, nama: true, email: true, divisi: true } },
            items: {
              include: {
                barang: { select: { id: true, nama: true, satuan: true } },
              },
            },
          },
        },
        petugas: { select: { id: true, nama: true } },
      },
    });
    return successResponse(res, "Daftar tugas petugas", { tugas });
  } catch (err) {
    console.error("List tugas error:", err);
    return errorResponse(res, "Gagal mengambil daftar tugas.", 500);
  }
}

/** PATCH /api/permintaan/tugas/:id — Petugas ubah status (DALAM_PROSES / SELESAI). Saat SELESAI, stok berkurang. */
export async function updateTugasStatus(req, res) {
  try {
    const { id: tugasId } = req.params;
    const { statusTugas, lokasiTujuan } = req.body;
    const petugasId = req.user.userId;

    if (
      !["DALAM_PROSES", "SELESAI", "ON_DELIVERY", "DELIVERED"].includes(
        statusTugas,
      )
    ) {
      return errorResponse(
        res,
        "statusTugas harus DALAM_PROSES, SELESAI, ON_DELIVERY, atau DELIVERED",
        400,
      );
    }

    const tugas = await prisma.tugasPetugas.findUnique({
      where: { id: tugasId },
      include: { permintaan: { include: { items: true } } },
    });
    if (!tugas) return errorResponse(res, "Tugas tidak ditemukan", 404);
    if (tugas.statusTugas === "DITOLAK") {
      return errorResponse(
        res,
        "Permintaan ini ditolak oleh admin, tidak dapat diproses",
        400,
      );
    }
    if (["SELESAI", "DELIVERED"].includes(tugas.statusTugas)) {
      return errorResponse(res, "Tugas sudah selesai", 400);
    }
    const isSelesai = statusTugas === "SELESAI" || statusTugas === "DELIVERED";
    if (isSelesai && tugas.petugasId !== petugasId) {
      return errorResponse(
        res,
        "Hanya petugas yang mengambil tugas yang bisa menandai selesai",
        400,
      );
    }

    const statusToSave =
      statusTugas === "DELIVERED"
        ? "DELIVERED"
        : statusTugas === "SELESAI"
          ? "SELESAI"
          : statusTugas;

    if (isSelesai) {
      const lokasi = String(lokasiTujuan || "").trim();
      if (!lokasi) {
        return errorResponse(res, "Lokasi tujuan wajib diisi", 400);
      }
      const permintaanId = tugas.permintaanId;
      await prisma.$transaction(async (tx) => {
        for (const item of tugas.permintaan.items) {
          await tx.barang.update({
            where: { id: item.barangId },
            data: { stok: { decrement: item.jumlah } },
          });
          // Catat log stok: pengurangan karena permintaan selesai (APPROVE)
          await tx.logStok.create({
            data: {
              barangId: item.barangId,
              perubahan: -item.jumlah,
              jenis: "APPROVE",
              referensiId: permintaanId,
              adminId: null,
            },
          });
        }
        await tx.tugasPetugas.update({
          where: { id: tugasId },
          data: { statusTugas: statusToSave, petugasId, lokasiTujuan: lokasi },
        });
        await tx.permintaan.update({
          where: { id: permintaanId },
          data: { statusAdmin: "SELESAI" },
        });
      });
    } else {
      await prisma.tugasPetugas.update({
        where: { id: tugasId },
        data: { statusTugas: statusToSave, petugasId },
      });
    }

    const updated = await prisma.tugasPetugas.findUnique({
      where: { id: tugasId },
      include: {
        permintaan: {
          include: {
            peminta: { select: { id: true, nama: true, email: true, divisi: true } },
            items: {
              include: {
                barang: { select: { id: true, nama: true, satuan: true } },
              },
            },
          },
        },
      },
    });
    return successResponse(
      res,
      statusTugas === "SELESAI"
        ? "Tugas ditandai selesai, stok telah dikurangi"
        : "Status tugas diupdate",
      { tugas: updated },
    );
  } catch (err) {
    console.error("Update tugas error:", err);
    return errorResponse(res, "Gagal mengupdate tugas.", 500);
  }
}
