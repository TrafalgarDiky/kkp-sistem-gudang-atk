# Backend API - Sistem Gudang ATK

Web Service API untuk Sistem Gudang ATK menggunakan Node.js + Express + PostgreSQL.

## 📋 Prerequisites

- Node.js (v18 atau lebih baru)
- PostgreSQL (lokal atau cloud seperti Supabase)
- npm atau yarn

## 🚀 Setup Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database

**Opsi A: PostgreSQL Lokal**
- Install PostgreSQL di komputer kamu
- Buat database baru: `CREATE DATABASE gudang_atk;`
- Copy `.env.example` menjadi `.env`
- Edit `.env`, sesuaikan `DATABASE_URL` dengan kredensial PostgreSQL kamu

**Opsi B: PostgreSQL Cloud (Supabase/Railway)**
- Buat akun di Supabase atau Railway
- Dapatkan connection string dari dashboard
- Copy `.env.example` menjadi `.env`
- Paste connection string ke `DATABASE_URL`

### 3. Setup Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Jalankan migrasi database (membuat tabel)
npm run prisma:migrate
```

### 4. Jalankan Server

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3001` (atau sesuai PORT di `.env`)

## 📁 Struktur Folder

```
backend/
├── src/
│   ├── server.js          # Entry point server
│   ├── routes/            # Route handlers
│   ├── controllers/       # Business logic
│   ├── middleware/        # Middleware (auth, validation)
│   └── utils/             # Helper functions
├── prisma/
│   └── schema.prisma      # Database schema
├── .env                   # Environment variables (jangan commit!)
├── .env.example           # Template .env
└── package.json
```

## 🔑 Environment Variables

Lihat `.env.example` untuk daftar lengkap variabel yang diperlukan.

## 📚 API Endpoints

(Dokumentasi endpoint akan ditambahkan setelah implementasi)

## 🛠️ Prisma Commands

```bash
# Generate Prisma Client setelah ubah schema
npm run prisma:generate

# Buat migrasi baru
npm run prisma:migrate

# Buka Prisma Studio (GUI untuk lihat/edit data)
npm run prisma:studio
```

## 📝 Notes

- Jangan commit file `.env` ke Git (sudah ada di `.gitignore`)
- Selalu gunakan `.env.example` sebagai template
- Untuk production, set `NODE_ENV=production` dan gunakan JWT_SECRET yang kuat
