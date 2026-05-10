import { Router } from "express";
import { saveDeviceToken } from "../controllers/deviceTokenController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Flutter mengirim token FCM setelah user login.
router.post("/", requireAuth, saveDeviceToken);

export default router;
