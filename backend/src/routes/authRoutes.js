// ============================================
// FILE: src/routes/authRoutes.js
// FUNGSI: Route untuk auth: register, login, verifikasi user (admin)
// Base path: /api/auth
// ============================================

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateMe,
  changeMyPassword,
  verifyUser,
  listPendingUsers,
  listUsers,
  updateUser,
  forgotPassword,
  resetPasswordWithToken,
} from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordWithToken);

// --- Route profil user yang sedang login ---
router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);
router.patch('/me/password', requireAuth, changeMyPassword);

// --- Route yang butuh login + role ADMIN ---
router.get('/pending', requireAuth, requireRole(['ADMIN']), listPendingUsers);
router.get('/users', requireAuth, requireRole(['ADMIN']), listUsers);
router.patch('/users/:id/verify', requireAuth, requireRole(['ADMIN']), verifyUser);
router.patch('/users/:id', requireAuth, requireRole(['ADMIN']), updateUser);

export default router;
