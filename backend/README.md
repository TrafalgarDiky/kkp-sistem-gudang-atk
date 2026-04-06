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
├── uploads/               # File gambar barang (GET /uploads/...) — salin folder ini saat pindah PC
├── .env                   # Environment variables (jangan commit!)
├── .env.example           # Template .env
└── package.json
```

### Gambar katalog (`uploads/`)

- File gambar **bukan** di dalam SQL dump; simpan di folder **`backend/uploads/`** (sejajar `src/`, **bukan** di folder `frontend`).
- Di database, simpan **`gambar_url` sebagai path relatif** `/uploads/namafile.jpg` agar tiap device bisa pakai IP server lewat `NEXT_PUBLIC_API_URL` di frontend.
- Upload baru lewat API sudah mengembalikan path relatif. Untuk data lama (`http://localhost:3001/...`): **`npm run normalize:gambar-url`**.
- Uji: `http://ALAMAT_BACKEND:3001/uploads/NAMA_FILE` — file harus ada di folder uploads di **server** backend.

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
