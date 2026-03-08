// ============================================
// FILE: src/routes/logStokRoutes.js
// Base path: /api/log-stok — Admin only
// ============================================

import { Router } from 'express';
import { listLogStok } from '../controllers/logStokController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

router.get('/', listLogStok);

export default router;
