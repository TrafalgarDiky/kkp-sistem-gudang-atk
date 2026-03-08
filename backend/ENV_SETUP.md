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

# URL dasar backend (untuk link gambar hasil upload; opsional)
# Jika tidak diisi, dipakai http://localhost:PORT
# BASE_URL="http://localhost:3001"

# Environment
NODE_ENV=development
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
   
   - **FRONTEND_URL**: URL frontend Next.js (default: http://localhost:3000)

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
