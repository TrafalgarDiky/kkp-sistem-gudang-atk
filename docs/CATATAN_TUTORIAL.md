# Catatan Tutorial — Backend Sistem Gudang ATK

Dokumen ini mencatat **cara membuat**, **untuk apa saja**, dan **cara menguji** backend API Sistem Gudang ATK (Node.js + Express + PostgreSQL).

---

## Daftar Isi

1. [Ringkasan Project](#1-ringkasan-project)
2. [Yang Dibutuhkan (Prerequisites)](#2-yang-dibutuhkan-prerequisites)
3. [Cara Membuat / Setup dari Awal](#3-cara-membuat--setup-dari-awal)
4. [Struktur Folder & Fungsi File](#4-struktur-folder--fungsi-file)
5. [Modul & Endpoint API](#5-modul--endpoint-api)
6. [Cara Menguji (Testing)](#6-cara-menguji-testing)
7. [Tahap Selanjutnya](#7-tahap-selanjutnya)

---

## 1. Ringkasan Project

- **Nama:** Web Service API untuk Sistem Gudang ATK
- **Stack:** Node.js, Express, PostgreSQL, Prisma (ORM), JWT, bcrypt
- **Fungsi:** API untuk aplikasi gudang ATK: auth (register, login, verifikasi), katalog barang (CRUD), permintaan ATK (Staff buat → Admin approve → Petugas selesai, stok berkurang).

---

## 2. Yang Dibutuhkan (Prerequisites)

- **Node.js** (v18+) — [nodejs.org](https://nodejs.org)
- **PostgreSQL** — lokal atau cloud (Supabase, dll.)
- **npm** (biasanya ikut Node.js)
- **Editor** (VS Code / Cursor, dll.)

---

## 3. Cara Membuat / Setup dari Awal

### Langkah 1: Inisialisasi project backend

```bash
cd backend
npm init -y
```

Edit `package.json`: set `"type": "module"` dan `"main": "src/server.js"`.

### Langkah 2: Install dependency

```bash
npm install express cors dotenv @prisma/client bcryptjs jsonwebtoken
npm install -D prisma nodemon
npm install @prisma/adapter-pg pg
```

- **express** — framework server HTTP
- **cors** — izinkan request dari frontend (domain lain)
- **dotenv** — baca variabel dari file `.env`
- **@prisma/client** + **prisma** — akses database
- **bcryptjs** — hash password
- **jsonwebtoken** — buat & verifikasi JWT
- **@prisma/adapter-pg** + **pg** — adapter PostgreSQL untuk Prisma 7

### Langkah 3: Setup Prisma & database

1. Buat database PostgreSQL (misal: `gudang_atk`).
2. Buat file `.env` di folder `backend/` (lihat `ENV_SETUP.md`), isi `DATABASE_URL` dan `JWT_SECRET`.
3. Untuk migrasi, jika pakai shadow database: buat database kedua (misal `gudang_atk_shadow`) dan set `SHADOW_DATABASE_URL` di `.env`.
4. Jalankan:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Schema database ada di `prisma/schema.prisma` (tabel: users, barang, permintaan, permintaan_item, tugas_petugas).

### Langkah 4: Seed data awal (Admin, Petugas, Staff)

```bash
npm run prisma:seed
```

Ini membuat user:
- Admin: `admin@gudang.atk` / `admin123`
- Petugas: `petugas@gudang.atk` / `petugas123`
- Staff: `staff@gudang.atk` / `staff123`

### Langkah 5: Jalankan server

```bash
npm run dev
```

Server berjalan di `http://localhost:3001` (atau sesuai `PORT` di `.env`).

---

## 4. Struktur Folder & Fungsi File

```
backend/
├── prisma/
│   ├── schema.prisma    # Definisi tabel & relasi database
│   ├── seed.js          # Data awal (Admin, Petugas, Staff)
│   └── migrations/      # Riwayat migrasi SQL
├── src/
│   ├── server.js        # Entry point: Express app, mount route, listen port
│   ├── config/
│   │   └── database.js  # Instance Prisma Client + adapter PostgreSQL
│   ├── controllers/     # Logika bisnis per modul
│   │   ├── authController.js
│   │   ├── barangController.js
│   │   └── permintaanController.js
│   ├── routes/          # Definisi endpoint (path + middleware + controller)
│   │   ├── authRoutes.js
│   │   ├── barangRoutes.js
│   │   └── permintaanRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js  # requireAuth, requireRole (JWT + role)
│   └── utils/
│       ├── response.js  # successResponse, errorResponse
│       ├── jwt.js       # signToken, verifyToken
│       └── password.js  # hashPassword, comparePassword
├── .env                 # Variabel rahasia (tidak di-commit)
├── ENV_SETUP.md         # Panduan isi .env
└── package.json
```

### Fungsi singkat per file

| File | Fungsi |
|------|--------|
| **server.js** | Load env, CORS, body parser, daftar route (auth, barang, permintaan), error handler, 404, listen port. |
| **config/database.js** | Buat Prisma Client dengan adapter PostgreSQL; dipakai semua controller untuk query DB. |
| **authController.js** | Register, login, verifikasi user (pending list, set AKTIF/DITOLAK). |
| **barangController.js** | List, detail, create, update, delete barang. |
| **permintaanController.js** | List/detail permintaan, buat permintaan (Staff), approve (Admin), list tugas & update status tugas (Petugas); saat status tugas SELESAI stok barang berkurang. |
| **authMiddleware.js** | `requireAuth`: cek header `Authorization: Bearer <token>`, isi `req.user`. `requireRole(roles)`: cek `req.user.role` termasuk di `roles`. |
| **utils/response.js** | Format response seragam: `{ success, message, data? }`. |
| **utils/jwt.js** | Buat token (signToken) dan verifikasi token (verifyToken). |
| **utils/password.js** | Hash password (hashPassword) dan bandingkan dengan hash (comparePassword). |

---

## 5. Modul & Endpoint API

### Format response umum

- Sukses: `{ success: true, message: "...", data?: { ... } }`
- Gagal: `{ success: false, message: "..." }`
- Header untuk endpoint yang butuh login: `Authorization: Bearer <token>`

---

### A. Auth (`/api/auth`)

| Method | Endpoint | Fungsi | Akses |
|--------|----------|--------|--------|
| POST | `/api/auth/register` | Daftar user baru (nama, email, password, role). Status awal BELUM_VERIFIKASI. | Publik |
| POST | `/api/auth/login` | Login; return token + data user. Hanya user dengan status AKTIF yang bisa login. | Publik |
| GET | `/api/auth/pending` | Daftar user yang belum diverifikasi (BELUM_VERIFIKASI). | ADMIN (token) |
| PATCH | `/api/auth/users/:id/verify` | Set status user jadi AKTIF atau DITOLAK. Body: `{ status: "AKTIF" \| "DITOLAK" }`. | ADMIN (token) |

---

### B. Barang (`/api/barang`)

| Method | Endpoint | Fungsi | Akses |
|--------|----------|--------|--------|
| GET | `/api/barang` | Daftar semua barang (nama, satuan, stok, gambar, dll.). | Semua role (token) |
| GET | `/api/barang/:id` | Detail satu barang. | Semua role (token) |
| POST | `/api/barang` | Tambah barang. Body: nama, satuan, stok (opsional), deskripsi, gambarUrl. | ADMIN (token) |
| PATCH | `/api/barang/:id` | Update barang (field yang dikirim saja). | ADMIN (token) |
| DELETE | `/api/barang/:id` | Hapus barang. | ADMIN (token) |

---

### C. Permintaan (`/api/permintaan`)

| Method | Endpoint | Fungsi | Akses |
|--------|----------|--------|--------|
| GET | `/api/permintaan` | Daftar permintaan. Staff: hanya punya sendiri; Admin/Petugas: semua. Query: `?status=MENUNGGU_ADMIN` (opsional). | Semua role (token) |
| GET | `/api/permintaan/:id` | Detail permintaan + item + peminta + tugas. | Semua role (token) |
| POST | `/api/permintaan` | Buat permintaan. Body: `{ items: [ { barangId, jumlah } ] }`. Otomatis buat satu tugas petugas. | STAFF (token) |
| PATCH | `/api/permintaan/:id/approve` | Approve/tolak permintaan. Body: `{ status: "DISETUJUI_ADMIN" \| "DITOLAK_ADMIN", catatanAdmin? }`. | ADMIN (token) |
| GET | `/api/permintaan/tugas` | Daftar tugas petugas (permintaan + item + peminta). Query: `?statusTugas=DALAM_PROSES` (opsional). | ADMIN, PETUGAS (token) |
| PATCH | `/api/permintaan/tugas/:id` | Update status tugas. Body: `{ statusTugas: "DALAM_PROSES" \| "SELESAI" }`. Saat SELESAI: stok barang dikurangi, permintaan status jadi SELESAI. | PETUGAS (token) |

---

## 6. Cara Menguji (Testing)

### 6.1 Cek server jalan

- Buka: `http://localhost:3001/api/health`
- Harus dapat JSON: `{ success: true, message: "API Server is running!", timestamp: "..." }`

### 6.2 Auth

**Register (publik):**
```javascript
fetch("http://localhost:3001/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    nama: "Budi",
    email: "budi@mail.com",
    password: "123456",
    role: "STAFF"
  }),
}).then(r => r.json()).then(console.log);
```

**Login Admin & simpan token:**
```javascript
fetch("http://localhost:3001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@gudang.atk", password: "admin123" }),
})
  .then(r => r.json())
  .then(res => { window.ADMIN_TOKEN = res.data?.token; console.log(res); });
```

**Daftar user pending (perlu token Admin):**
```javascript
fetch("http://localhost:3001/api/auth/pending", {
  headers: { Authorization: `Bearer ${window.ADMIN_TOKEN}` },
}).then(r => r.json()).then(console.log);
```

**Verifikasi user (set AKTIF):** ganti `USER_ID` dengan id dari list pending.
```javascript
fetch(`http://localhost:3001/api/auth/users/USER_ID/verify`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.ADMIN_TOKEN}` },
  body: JSON.stringify({ status: "AKTIF" }),
}).then(r => r.json()).then(console.log);
```

### 6.3 Barang

**List barang (perlu token):**
```javascript
fetch("http://localhost:3001/api/barang", {
  headers: { Authorization: `Bearer ${window.ADMIN_TOKEN}` },
}).then(r => r.json()).then(console.log);
```

**Tambah barang (Admin):**
```javascript
fetch("http://localhost:3001/api/barang", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.ADMIN_TOKEN}` },
  body: JSON.stringify({
    nama: "Pulpen Hitam",
    satuan: "buah",
    stok: 100,
    deskripsi: "Pulpen standar kantor",
    gambarUrl: null
  }),
}).then(r => r.json()).then(console.log);
```

**Update barang (Admin):** ganti `BARANG_ID`.
```javascript
fetch(`http://localhost:3001/api/barang/BARANG_ID`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.ADMIN_TOKEN}` },
  body: JSON.stringify({ stok: 150 }),
}).then(r => r.json()).then(console.log);
```

**Hapus barang (Admin):** ganti `BARANG_ID`.
```javascript
fetch(`http://localhost:3001/api/barang/BARANG_ID`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${window.ADMIN_TOKEN}` },
}).then(r => r.json()).then(console.log);
```

### 6.4 Permintaan (alur lengkap)

**1) Login Staff, ambil BARANG_ID, buat permintaan:**
```javascript
fetch("http://localhost:3001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "staff@gudang.atk", password: "staff123" }),
})
  .then(r => r.json())
  .then(res => { window.STAFF_TOKEN = res.data?.token; return fetch("http://localhost:3001/api/barang", { headers: { Authorization: `Bearer ${res.data?.token}` } }); })
  .then(r => r.json())
  .then(res => {
    const barangId = res.data?.barang?.[0]?.id;
    return fetch("http://localhost:3001/api/permintaan", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.STAFF_TOKEN}` },
      body: JSON.stringify({ items: [{ barangId, jumlah: 5 }] }),
    });
  })
  .then(r => r.json())
  .then(res => { window.PERMINTAAN_ID = res.data?.permintaan?.id; console.log("Permintaan dibuat:", res); });
```

**2) Login Admin, approve permintaan:**
```javascript
fetch("http://localhost:3001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@gudang.atk", password: "admin123" }),
})
  .then(r => r.json())
  .then(res => {
    window.ADMIN_TOKEN = res.data?.token;
    return fetch(`http://localhost:3001/api/permintaan/${window.PERMINTAAN_ID}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.ADMIN_TOKEN}` },
      body: JSON.stringify({ status: "DISETUJUI_ADMIN", catatanAdmin: "Oke disetujui" }),
    });
  })
  .then(r => r.json())
  .then(console.log);
```

**3) Login Petugas, lihat tugas, tandai selesai (stok berkurang):**
```javascript
fetch("http://localhost:3001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "petugas@gudang.atk", password: "petugas123" }),
})
  .then(r => r.json())
  .then(res => {
    window.PETUGAS_TOKEN = res.data?.token;
    return fetch("http://localhost:3001/api/permintaan/tugas", {
      headers: { Authorization: `Bearer ${window.PETUGAS_TOKEN}` },
    });
  })
  .then(r => r.json())
  .then(res => {
    const tugasId = res.data?.tugas?.[0]?.id;
    return fetch(`http://localhost:3001/api/permintaan/tugas/${tugasId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.PETUGAS_TOKEN}` },
      body: JSON.stringify({ statusTugas: "SELESAI" }),
    });
  })
  .then(r => r.json())
  .then(console.log);
```

Setelah itu cek lagi GET `/api/barang` — stok barang yang diminta harus sudah berkurang.

---

## 7. Tahap Selanjutnya

Backend API sudah selesai. Langkah berikut yang bisa dilakukan:

1. **Frontend (Next.js)**  
   - Halaman login/register, dashboard per role (Staff, Admin, Petugas).  
   - Halaman katalog barang, form permintaan (Staff), daftar permintaan & approve (Admin), daftar tugas & tandai selesai (Petugas).  
   - Semua panggilan pakai `fetch` ke `http://localhost:3001/api/...` dengan header `Authorization: Bearer <token>`.

2. **Dokumentasi API**  
   - Bisa ditambah dokumen terpisah (atau bagian di file ini) untuk tiap endpoint: parameter, body, contoh response.

3. **Deploy**  
   - Backend di-host (Render, Railway, VPS, dll.), database PostgreSQL (Supabase/Railway, dll.), set `DATABASE_URL` dan `JWT_SECRET` di environment production.

4. **Keamanan & validasi**  
   - Validasi input lebih ketat (misal pakai library validasi), rate limit, pengecekan stok saat buat permintaan (opsional).

---

*Dokumen ini dibuat sebagai catatan tutorial cara membuat, fungsi, dan cara menguji backend Sistem Gudang ATK.*
