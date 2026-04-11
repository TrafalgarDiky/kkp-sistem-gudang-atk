/**
 * Route upload gambar — hanya ADMIN.
 */
import { Router } from 'express';
import { uploadMemory } from '../config/upload.js';
import { uploadGambar } from '../controllers/uploadController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/upload — field name: "gambar" (file)
router.post('/', requireAuth, requireRole(['ADMIN']), uploadMemory.single('gambar'), uploadGambar);

export default router;
