// ============================================
// FILE: prisma/seed.js
// FUNGSI: Isi data awal (seed) — satu admin agar bisa login
// Jalankan: npm run prisma:seed atau npx prisma db seed
// ============================================

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@gudang.atk';
  const passwordHash = await bcrypt.hash('admin123', 10);

  const email2 = 'admin2@gudang.atk';
  const passwordHash2 = await bcrypt.hash('admin222', 10);

  // Upsert: buat kalau belum ada, atau update jadi AKTIF + password admin123 kalau sudah ada
  await prisma.user.upsert({
    where: { email },
    create: {
      nama: 'Admin Gudang',
      email,
      passwordHash,
      role: 'ADMIN',
      statusAkun: 'AKTIF'
    },
    where: {email2},
    create: {
      nama: 'Admin Gudang 2',
      email2,
      passwordHash2,
      role: 'ADMIN',
      statusAkun: 'AKTIF'
    },
    update: {
      statusAkun: 'AKTIF',
      passwordHash,
      role: 'ADMIN',
      nama: 'Admin Gudang'
    }
  });
  console.log('Admin siap: email = admin@gudang.atk, password = admin123 (status AKTIF)');

  // Petugas (untuk tes tugas pengantaran)
  await prisma.user.upsert({
    where: { email: 'petugas@gudang.atk' },
    create: {
      nama: 'Petugas Gudang',
      email: 'petugas@gudang.atk',
      passwordHash: await bcrypt.hash('petugas123', 10),
      role: 'PETUGAS',
      statusAkun: 'AKTIF'
    },
    update: { statusAkun: 'AKTIF', passwordHash: await bcrypt.hash('petugas123', 10), role: 'PETUGAS', nama: 'Petugas Gudang' }
  });
  console.log('Petugas siap: email = petugas@gudang.atk, password = petugas123');

  // Staff (untuk tes buat permintaan)
  await prisma.user.upsert({
    where: { email: 'staff@gudang.atk' },
    create: {
      nama: 'Staff Contoh',
      email: 'staff@gudang.atk',
      passwordHash: await bcrypt.hash('staff123', 10),
      role: 'STAFF',
      statusAkun: 'AKTIF'
    },
    update: { statusAkun: 'AKTIF', passwordHash: await bcrypt.hash('staff123', 10), role: 'STAFF', nama: 'Staff Contoh' }
  });
  console.log('Staff siap: email = staff@gudang.atk, password = staff123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
