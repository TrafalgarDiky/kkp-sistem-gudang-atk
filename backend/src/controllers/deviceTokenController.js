import prisma from "../config/database.js";
import { successResponse, errorResponse } from "../utils/response.js";

/** POST /api/device-token — simpan/update token FCM milik user yang sedang login. */
export async function saveDeviceToken(req, res) {
  try {
    const userId = req.user.userId;
    const { token, platform } = req.body;

    const cleanToken = typeof token === "string" ? token.trim() : "";
    const cleanPlatform =
      typeof platform === "string" && platform.trim()
        ? platform.trim().toLowerCase()
        : "android";

    if (!cleanToken) {
      return errorResponse(res, "Token FCM wajib diisi.", 400);
    }

    const deviceToken = await prisma.deviceToken.upsert({
      where: { token: cleanToken },
      update: {
        userId,
        platform: cleanPlatform,
      },
      create: {
        userId,
        token: cleanToken,
        platform: cleanPlatform,
      },
      select: {
        id: true,
        platform: true,
        updatedAt: true,
      },
    });

    return successResponse(res, "Token device berhasil disimpan.", {
      deviceToken,
    });
  } catch (err) {
    console.error("Save device token error:", err);
    return errorResponse(res, "Gagal menyimpan token device.", 500);
  }
}
