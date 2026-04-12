# Setup Environment Variables (.env)

File `.env` berisi konfigurasi rahasia (database password, JWT secret, dll).  
**JANGAN commit file `.env` ke Git!**

## Cara Setup

1. **Buat file `.env` di folder `backend/`** (copy manual, atau buat file baru)

2. **Isi dengan template berikut:**

```env
# Database Connection
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
# Contoh untuk PostgreSQL lokal:
DATABASE_URL="postgresql://postgres:password123@localhost:5432/gudang_atk?schema=public"

# JWT Secret Key (untuk sign token)
# Generate random string yang panjang dan aman
# Bisa pakai: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-minimal-32-characters"

# Server Port
PORT=3001

# Frontend URL (untuk CORS)
FRONTEND_URL="http://localhost:3000"

# Environment
NODE_ENV=development

# --- Opsional: kirim email reset password (lupa password) ---
# Tanpa ini, di development tautan reset dicetak di terminal backend.
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=email.kamu@gmail.com
# SMTP_PASS=app-password-gmail
# SMTP_FROM="Gudang ATK <email.kamu@gmail.com>"
```

3. **Sesuaikan nilai sesuai setup kamu:**

   - **DATABASE_URL**: 
     - Jika PostgreSQL lokal: ganti `postgres`, `password123`, `localhost`, `5432`, `gudang_atk` sesuai setup kamu
     - Jika pakai Supabase: ambil connection string dari dashboard Supabase
   
   - **JWT_SECRET**: 
     - Generate random string panjang (minimal 32 karakter)
     - Bisa pakai: `openssl rand -base64 32` di terminal
     - Atau pakai generator online: https://randomkeygen.com/
   
   - **PORT**: Port untuk backend API (default: 3001)
   
   - **FRONTEND_URL**: URL frontend Next.js (default: http://localhost:3000). Dipakai juga untuk **tautan reset password** di email.

## Gambar katalog (disarankan production: Supabase Storage)

**Masalah:** File di folder `backend/uploads/` pada Railway **hilang tiap redeploy** kecuali pakai volume. Solusi yang **aman dan tahan lama**: simpan file ke **Supabase Storage**, URL publik disimpan di kolom `gambar_url`.

### 1) Buat bucket di Supabase

1. Dashboard Supabase → **Storage** → **New bucket**
2. Nama bucket bebas (mis. **`foto-barang`** atau **`barang-gambar`**), yang penting **public read** untuk katalog.
3. Centang **Public bucket** (agar gambar bisa dibaca browser tanpa token)
4. Kalau nama bucket **bukan** `barang-gambar`, set juga **`SUPABASE_STORAGE_BUCKET`** di Railway / `.env` (lihat bawah).

### 2) Variabel environment backend (Railway / `.env`)

```env
# URL project: Settings → API → Project URL (bukan connection string database)
SUPABASE_URL="https://xxxxxxxx.supabase.co"

# service_role — rahasia, hanya server. JANGAN pakai di frontend / NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# Di Railway: tempel value TANPA kutip tambahan (jangan "eyJ..." dengan kutip ganda di UI).
# Kalau error "Invalid Compact JWS", salin ulang key service_role utuh (satu baris, dimulai eyJ).
# JANGAN pakai Secret Key model sb_secret_... — backend butuh JWT "service_role" (dimulai eyJ) dari Settings → API.

# Opsional: nama bucket Storage (default barang-gambar). Contoh kalau bucket kamu "foto-barang":
# SUPABASE_STORAGE_BUCKET="foto-barang"
# Cadangan nama variabel (kalau typo di Railway): SUPABASE_BUCKET atau STORAGE_BUCKET
```

Tanpa kedua variabel di atas, backend tetap menyimpan upload ke folder **`uploads/` lokal** (cocok untuk development di PC).

### 3) Perilaku

- **Ada `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`:** upload → bucket yang di-set (`SUPABASE_STORAGE_BUCKET` atau default **`barang-gambar`**) → response `url` berupa **https://...supabase.co/storage/...** (disimpan ke DB).
- **Tidak ada:** sama seperti sebelumnya → file ke **`/uploads/...`** di server.

### 4) Data lama

Barang lama dengan path `/uploads/...` yang file-nya sudah tidak ada: **edit barang** di admin dan **upload ulang gambar**, atau isi `gambar_url` manual ke URL Supabase setelah upload.

---

## Gambar katalog (mode lokal / tanpa Storage)

- **Frontend** (`frontend/.env`): **`NEXT_PUBLIC_API_URL`** ke backend yang bisa dijangkau device.
- **Backend**: **`FRONTEND_URL`** = URL yang dipakai buka web.
- **Folder `backend/uploads/`** harus ada di mesin yang menjalankan backend.
- Data lama berisi `http://localhost:3001/uploads/...`? Jalankan **`npm run normalize:gambar-url`** di folder backend.

## Lupa password & SMTP (email)

Fitur **Lupa password** mengirim tautan ke `FRONTEND_URL/reset-password?token=...`.

- **Development tanpa SMTP:** setelah `POST /api/auth/forgot-password`, **buka terminal backend** — tautan lengkap dicetak di log.
- **Production / uji email nyata:** isi `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (Gmail: pakai [App Password](https://support.google.com/accounts/answer/185833), bukan password akun biasa).

## Contoh Setup PostgreSQL Lokal

Jika kamu install PostgreSQL di Windows:

1. Install PostgreSQL dari https://www.postgresql.org/download/windows/
2. Saat install, set password untuk user `postgres` (misal: `mypassword123`)
3. Buat database baru:
   ```sql
   CREATE DATABASE gudang_atk;
   ```
4. Di `.env`, set:
   ```env
   DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/gudang_atk?schema=public"
   ```

## Contoh Setup Supabase (Cloud PostgreSQL)

1. Buat akun di https://supabase.com
2. Buat project baru
3. Di dashboard, masuk ke **Settings** → **Database**
4. Copy **Connection string** (pilih "URI" atau "Connection pooling")
5. Paste ke `.env` sebagai `DATABASE_URL`

## Shadow database (wajib untuk `prisma migrate dev`)

Prisma **tidak boleh** memakai database yang sama untuk "shadow database". Jadi kamu perlu **database kedua** (hanya untuk development/migrasi).

### PostgreSQL lokal (paling mudah)

1. Buat database kedua (nama bebas, misalnya `gudang_atk_shadow`). Di **psql** atau pgAdmin:
   ```sql
   CREATE DATABASE gudang_atk_shadow;
   ```
2. Di `.env` tambahkan (sesuaikan user, password, port):
   ```env
   SHADOW_DATABASE_URL="postgresql://postgres:password123@localhost:5432/gudang_atk_shadow?schema=public"
   ```
   Ganti `postgres`, `password123`, `5432` agar sama dengan yang dipakai di `DATABASE_URL`.

Lalu jalankan lagi: `npm run prisma:migrate`.

### Supabase / cloud (hanya satu database)

Kalau kamu cuma punya satu database (misalnya di Supabase) dan tidak bisa buat database kedua:

- Pakai **`prisma db push`** untuk membuat tabel dari schema (tanpa riwayat migrasi):
  ```bash
  npx prisma db push
  ```
  Setelah itu tabel akan ada di database dan kamu bisa lanjut development. Nanti untuk production bisa atur migrasi terpisah kalau perlu.

### Error P3014

Artinya Prisma tidak bisa **membuat** shadow database otomatis (biasanya di cloud). Solusi: set `SHADOW_DATABASE_URL` ke database **lain** seperti di atas, atau pakai `prisma db push` jika tidak ada database kedua.

---

## Error P1000 (Authentication failed)

Artinya **kredensial database ditolak**: user/password salah atau format URL salah.

**Cek ini:**

1. **Username & password benar**  
   - Di PostgreSQL lokal: user default `postgres`, password yang kamu set saat install.  
   - Di Supabase: pakai user dan password dari **Settings → Database** (bukan API key).

2. **Password ada karakter khusus**  
   - Jika password pakai `@`, `#`, `:`, `/`, `?`, dll., harus di-**URL-encode** di connection string.  
   - Contoh: password `p@ss#123` → tulis `p%40ss%23123`.  
   - Atau ganti dulu password ke yang tanpa karakter khusus untuk uji.

3. **Format URL benar**  
   - Harus seperti:  
     `postgresql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE?schema=public`  
   - Tidak ada spasi, tanda kutip di dalam URL, atau typo.

4. **Database benar-benar ada**  
   - Untuk PostgreSQL lokal:  
     `CREATE DATABASE gudang_atk;`  
   - Untuk shadow:  
     `CREATE DATABASE gudang_atk_shadow;`

5. **Supabase**  
   - Pakai **Connection string** dari **Settings → Database**, pilih **URI**.  
   - Password di sana adalah **Database password** (bisa reset di halaman yang sama).  
   - Jangan pakai `anon` / `service_role` key di URL koneksi database.

**Tes koneksi manual (opsional):**  
Bisa tes dari terminal dengan `psql` (jika terpasang):
```bash
psql "postgresql://postgres:password123@localhost:5432/gudang_atk"
```
Jika ini gagal, perbaiki user/password/host/port/database dulu, lalu sesuaikan `.env`.

## Setelah Setup .env

Jalankan migrasi database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Lalu jalankan server:

```bash
npm run dev
```
db lokal =
DATABASE_URL="postgresql://gudang_user:dotamania99@localhost:5432/gudang_atk?schema=public"

db supabase online =
DATABASE_URL = "postgresql://postgres:[YOUR-PASSWORD]@db.mfvdwmupwmittmyfdbpm.supabase.co:5432/postgres"