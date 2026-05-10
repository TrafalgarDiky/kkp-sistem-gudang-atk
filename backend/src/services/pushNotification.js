import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import prisma from "../config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

let firebaseApp = null;
let firebaseInitChecked = false;

function loadServiceAccount() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  }

  const rawPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!rawPath) return null;

  const resolvedPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(backendRoot, rawPath);
  return JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
}

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  if (firebaseInitChecked) return null;

  firebaseInitChecked = true;

  try {
    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      console.warn(
        "[push] Firebase belum dikonfigurasi. Set FIREBASE_SERVICE_ACCOUNT_PATH atau FIREBASE_SERVICE_ACCOUNT_JSON."
      );
      return null;
    }

    firebaseApp =
      getApps()[0] ||
      initializeApp({
        credential: cert(serviceAccount),
      });
    return firebaseApp;
  } catch (err) {
    console.warn("[push] Gagal inisialisasi Firebase:", err?.message);
    return null;
  }
}

async function sendPushToRole(role, message) {
  const app = getFirebaseApp();
  if (!app) return;

  const tokens = await prisma.deviceToken.findMany({
    where: { user: { role } },
    select: { token: true },
  });
  const tokenValues = tokens.map((item) => item.token).filter(Boolean);
  if (tokenValues.length === 0) return;

  const messaging = getMessaging(app);
  const response = await messaging.sendEachForMulticast({
    tokens: tokenValues,
    notification: {
      title: message.title,
      body: message.body,
    },
    android: {
      priority: "high",
      notification: {
        channelId: "tugas_baru",
      },
    },
    data: Object.fromEntries(
      Object.entries(message.data || {}).map(([key, value]) => [
        key,
        String(value ?? ""),
      ])
    ),
  });

  const invalidTokens = response.responses
    .map((result, index) => ({ result, token: tokenValues[index] }))
    .filter(({ result }) => {
      const code = result.error?.code;
      return (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      );
    })
    .map(({ token }) => token);

  if (invalidTokens.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { token: { in: invalidTokens } },
    });
  }

  console.log(
    `[push] PETUGAS: sukses=${response.successCount}, gagal=${response.failureCount}`
  );
}

export async function notifyPetugasTugasBaru(permintaan) {
  try {
    const kode = permintaan?.kode ? ` (${permintaan.kode})` : "";
    await sendPushToRole("PETUGAS", {
      title: "Tugas baru",
      body: `Ada permintaan baru${kode} yang bisa diambil.`,
      data: {
        type: "TUGAS_BARU",
        permintaanId: permintaan?.id,
        kode: permintaan?.kode,
      },
    });
  } catch (err) {
    console.warn("[push] Gagal kirim notifikasi tugas baru:", err?.message);
  }
}
