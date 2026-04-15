import { Router } from "express";
import {
  listPermintaan,
  getPermintaanById,
  createPermintaan,
  approvePermintaan,
  batalPermintaan,
  listTugasPetugas,
  ambilTugas,
  lepasTugas,
  updateTugasStatus,
} from "../controllers/permintaanController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// --- Path spesifik dulu agar "tugas" tidak tertimpa oleh :id ---
// GET /api/permintaan/tugas — daftar tugas (Petugas & Admin)
router.get(
  "/tugas",
  requireAuth,
  requireRole(["ADMIN", "PETUGAS"]),
  listTugasPetugas,
);
// PATCH /api/permintaan/tugas/:id/ambil — Petugas ambil tugas
router.patch(
  "/tugas/:id/ambil",
  requireAuth,
  requireRole(["PETUGAS"]),
  ambilTugas,
);
// PATCH /api/permintaan/tugas/:id/lepas — Petugas lepas tugas
router.patch(
  "/tugas/:id/lepas",
  requireAuth,
  requireRole(["PETUGAS"]),
  lepasTugas,
);
// PATCH /api/permintaan/tugas/:id — Petugas tandai selesai (stok berkurang)
router.patch(
  "/tugas/:id",
  requireAuth,
  requireRole(["PETUGAS"]),
  updateTugasStatus,
);

// GET /api/permintaan — list (Staff: punya sendiri, Admin/Petugas: semua)
router.get("/", requireAuth, listPermintaan);
// GET /api/permintaan/:id — detail
router.get("/:id", requireAuth, getPermintaanById);
// POST /api/permintaan — Staff, Admin, Petugas bisa buat permintaan
router.post("/", requireAuth, requireRole(["STAFF", "ADMIN", "PETUGAS"]), createPermintaan);
// PATCH /api/permintaan/:id/approve — Admin setujui/tolak (hanya approve/reject, tidak ambil tugas)
router.patch(
  "/:id/approve",
  requireAuth,
  requireRole(["ADMIN"]),
  approvePermintaan,
);
router.patch(
  "/:id/batal",
  requireAuth,
  requireRole(["STAFF"]),
  batalPermintaan,
);

export default router;
