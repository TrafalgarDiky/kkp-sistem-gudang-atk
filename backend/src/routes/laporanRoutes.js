// ============================================
// FILE: src/routes/laporanRoutes.js
// Base path: /api/laporan — Admin only
// ============================================

import { Router } from 'express';
import { getLaporan } from '../controllers/laporanController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

router.get('/', getLaporan);

export default router;
