// Tujuan: Mengisi "kode" untuk permintaan lama yang masih NULL.
// Cara: node prisma/backfill-kode-permintaan.js
//
// Input: baris permintaan dengan kode = NULL
// Output: P-0001, P-0002, … (lanjut dari angka terbesar di kode yang sudah ada)

import prisma from "../src/config/database.js";

function formatKodePermintaan(urut) {
  return `P-${String(urut).padStart(4, "0")}`;
}

function parseKodePermintaan(kode) {
  const m = /^P-(\d+)$/.exec(kode || "");
  return m ? Number(m[1]) : null;
}

async function main() {
  const existing = await prisma.permintaan.findMany({
    where: { kode: { not: null } },
    select: { kode: true },
  });

  let maxNum = existing.reduce((m, r) => {
    const n = parseKodePermintaan(r.kode);
    return n == null ? m : Math.max(m, n);
  }, 0);

  const targets = await prisma.permintaan.findMany({
    where: { kode: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  console.log("Permintaan tanpa kode:", targets.length);
  console.log("Angka terbesar dari kode ada:", maxNum || "(belum ada)");

  for (const row of targets) {
    maxNum += 1;
    const kode = formatKodePermintaan(maxNum);
    await prisma.permintaan.update({
      where: { id: row.id },
      data: { kode },
    });
    console.log(`OK ${row.id.slice(0, 8)}… => ${kode}`);
  }

  console.log("Selesai. Total diupdate:", targets.length);
}

main()
  .catch((e) => {
    console.error("Backfill gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
