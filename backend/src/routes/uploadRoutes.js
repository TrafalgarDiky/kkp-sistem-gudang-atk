/**
 * Route upload gambar — hanya ADMIN.
 */
import { Router } from 'express';
import upload from '../config/upload.js';
import { uploadGambar } from '../controllers/uploadController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/upload — field name: "gambar" (file)
router.post('/', requireAuth, requireRole(['ADMIN']), upload.single('gambar'), uploadGambar);

export default router;
