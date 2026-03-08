// ============================================
// FILE: src/routes/restockRoutes.js
// Base path: /api/restock — Admin only
// ============================================

import { Router } from 'express';
import { createRestock, listRestock } from '../controllers/restockController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

router.post('/', createRestock);
router.get('/', listRestock);

export default router;
