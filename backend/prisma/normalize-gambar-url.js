/**
 * Satu kali: ubah gambar_url dari http://localhost:3001/uploads/... → /uploads/...
 * Supaya katalog gambar jalan di HP / laptop lain (pakai NEXT_PUBLIC_API_URL).
 *
 * Jalankan: node prisma/normalize-gambar-url.js
 */
import prisma from '../src/config/database.js';

async function main() {
  const rows = await prisma.barang.findMany({
    where: { gambarUrl: { not: null } },
    select: { id: true, nama: true, gambarUrl: true },
  });

  let updated = 0;
  for (const r of rows) {
    const u = r.gambarUrl;
    if (!u || !/^https?:\/\//i.test(u)) continue;
    const relative = u.replace(/^https?:\/\/[^/]+/i, '');
    if (!relative.startsWith('/uploads/') || relative === u) continue;

    await prisma.barang.update({
      where: { id: r.id },
      data: { gambarUrl: relative },
    });
    console.log(`OK  ${r.nama}: ${u} → ${relative}`);
    updated++;
  }

  console.log(`\nSelesai. Diperbarui: ${updated} baris.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
