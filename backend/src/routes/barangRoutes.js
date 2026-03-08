import { Router } from 'express';
import {
  listBarang,
  createBarang,
  getBarangById,
  updateBarang,
  deleteBarang,
} from '../controllers/barangController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/barang — daftar semua barang (semua role yang login)
router.get('/', requireAuth, listBarang);

// GET /api/barang/:id — detail satu barang
router.get('/:id', requireAuth, getBarangById);

// POST /api/barang — tambah barang (hanya ADMIN)
router.post('/', requireAuth, requireRole(['ADMIN']), createBarang);

// PATCH /api/barang/:id — update barang (hanya ADMIN)
router.patch('/:id', requireAuth, requireRole(['ADMIN']), updateBarang);

// DELETE /api/barang/:id — hapus barang (hanya ADMIN)
router.delete('/:id', requireAuth, requireRole(['ADMIN']), deleteBarang);

export default router;