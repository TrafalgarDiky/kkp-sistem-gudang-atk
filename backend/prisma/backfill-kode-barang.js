// Tujuan: Mengisi "kode" untuk data barang lama yang masih NULL.
// Cara jalanin: node prisma/backfill-kode-barang.js
//
// Input: tabel "barang" yang sebagian barisnya kode = NULL
// Output: setiap barang yang kode-nya NULL akan diisi A-0001, A-0002, dst (lanjut dari kode terbesar yang sudah ada)

import prisma from '../src/config/database.js';

function formatKodeBarang(nomorUrut) {
  return `A-${String(nomorUrut).padStart(4, '0')}`;
}

function parseKodeBarang(kode) {
  const match = /^A-(\d+)$/.exec(kode || '');
  return match ? Number(match[1]) : null;
}

async function main() {
  const existing = await prisma.barang.findMany({
    where: { kode: { not: null } },
    select: { kode: true },
  });

  const maxNum = existing.reduce((m, r) => {
    const n = parseKodeBarang(r.kode);
    return n == null ? m : Math.max(m, n);
  }, 0);

  const targets = await prisma.barang.findMany({
    where: { kode: null },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, nama: true },
  });

  console.log('Barang tanpa kode:', targets.length);
  console.log('Kode terbesar saat ini:', maxNum ? formatKodeBarang(maxNum) : '(belum ada)');

  let next = maxNum;
  for (const b of targets) {
    next += 1;
    const kode = formatKodeBarang(next);
    await prisma.barang.update({
      where: { id: b.id },
      data: { kode },
    });
    console.log(`OK: ${b.nama} => ${kode}`);
  }

  console.log('Selesai. Total diupdate:', targets.length);
}

main()
  .catch((e) => {
    console.error('Backfill gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

