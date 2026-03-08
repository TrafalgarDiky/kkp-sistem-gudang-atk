// ============================================
// FILE: src/routes/adminRoutes.js
// Base path: /api/admin — Admin only
// ============================================

import { Router } from 'express';
import { getDashboard } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth, requireRole(['ADMIN']));

router.get('/dashboard', getDashboard);

export default router;
