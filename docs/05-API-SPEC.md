# API Specification — Sistem Gudang ATK

> Dokumentasi **lengkap semua endpoint REST API**. Format JSON konsisten. Versi: 1.0. Base URL dev: `http://localhost:3001`. Base URL production: `https://<railway-app>.up.railway.app`.

**Mahasiswa:** `<TODO: Nama>` · **NIM:** `<TODO>` · **Dosen Pembimbing:** `<TODO>` · **Instansi KKP:** `<TODO>`

---

## 1. Konvensi Umum

### 1.1 Header
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>   # untuk endpoint privat
```

### 1.2 Format Response

**Sukses**
```json
{
  "success": true,
  "message": "Deskripsi singkat",
  "data": { ... }
}
```

**Gagal**
```json
{
  "success": false,
  "message": "Alasan error",
  "errors": { ... }
}
```

### 1.3 HTTP Status Code
| Code | Arti | Contoh |
|------|------|--------|
| 200 | OK | Query sukses |
| 201 | Created | Resource baru dibuat |
| 400 | Bad Request | Validasi gagal |
| 401 | Unauthorized | JWT hilang / invalid |
| 403 | Forbidden | Role tidak sesuai |
| 404 | Not Found | Resource tidak ada |
| 409 | Conflict | Permintaan di-lock admin lain |
| 429 | Too Many Requests | Kena rate limit |
| 500 | Internal Server Error | Error tak terduga |

### 1.4 Role Akses Singkatan
`P` = Public (tanpa login) · `L` = Login (semua role) · `A` = Admin · `S` = Staff · `T` = Petugas.

---

## 2. Tabel Ringkas Semua Endpoint

| Method | Endpoint | Akses | Fungsi |
|--------|----------|:-----:|--------|
| GET    | `/api/health` | P | Cek server hidup + status storage |
| GET    | `/` | P | Welcome banner |
| GET    | `/api/debug/routes` | P | Daftar route auth (dev only, nanti dihapus) |
| GET    | `/uploads/:filename` | P | File gambar (fallback lokal, kalau Supabase Storage tidak aktif) |
| POST   | `/api/auth/register` | P | Daftar user |
| POST   | `/api/auth/login` | P | Login → JWT |
| POST   | `/api/auth/forgot-password` | P | Minta token reset |
| POST   | `/api/auth/reset-password` | P | Set password baru |
| GET    | `/api/auth/me` | L | Profil sendiri |
| PATCH  | `/api/auth/me` | L | Update profil sendiri |
| GET    | `/api/auth/pending` | A | User belum terverifikasi |
| GET    | `/api/auth/users` | A | Daftar semua user |
| PATCH  | `/api/auth/users/:id/verify` | A | Verifikasi user |
| PATCH  | `/api/auth/users/:id` | A | Update user (role/status) |
| GET    | `/api/barang` | L | Daftar barang |
| GET    | `/api/barang/:id` | L | Detail barang |
| POST   | `/api/barang` | A | Tambah barang |
| PATCH  | `/api/barang/:id` | A | Ubah barang |
| DELETE | `/api/barang/:id` | A | Hapus barang |
| POST   | `/api/upload` | A | Upload gambar (field `gambar`) |
| GET    | `/api/permintaan` | L | Daftar permintaan |
| GET    | `/api/permintaan/:id` | L | Detail permintaan |
| POST   | `/api/permintaan` | S A T | Buat permintaan |
| PATCH  | `/api/permintaan/:id/approve` | A | Approve / tolak |
| PATCH  | `/api/permintaan/:id/batal` | S | Batal permintaan sendiri |
| GET    | `/api/permintaan/tugas` | A T | Daftar tugas petugas |
| PATCH  | `/api/permintaan/tugas/:id/ambil` | T | Petugas ambil tugas |
| PATCH  | `/api/permintaan/tugas/:id/lepas` | T | Petugas lepas tugas |
| PATCH  | `/api/permintaan/tugas/:id` | T | Petugas tandai selesai |
| POST   | `/api/restock` | A | Catat stok masuk |
| GET    | `/api/restock` | A | Daftar restock |
| GET    | `/api/log-stok` | A | Daftar log stok |
| GET    | `/api/laporan` | A | Laporan periodik |
| GET    | `/api/admin/dashboard` | A | Ringkasan dashboard |

---

## 3. Detail Endpoint

### 3.1 Auth

#### `POST /api/auth/register` — Public
Request:
```json
{
  "nama": "Budi Santoso",
  "email": "budi@kantor.com",
  "password": "rahasia123",
  "divisi": "Keuangan"
}
```
Response 201:
```json
{
  "success": true,
  "message": "Registrasi berhasil. Tunggu verifikasi admin.",
  "data": { "user": { "id": "...", "nama": "Budi Santoso", "email": "budi@kantor.com", "role": "STAFF", "statusAkun": "BELUM_VERIFIKASI" } }
}
```
Error: `400` email sudah terpakai / password kurang kuat.

#### `POST /api/auth/login` — Public (rate-limit 10/15 menit/IP)
Request:
```json
{ "email": "budi@kantor.com", "password": "rahasia123" }
```
Response 200:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "nama": "Budi", "role": "STAFF", "statusAkun": "AKTIF" }
  }
}
```
Error: `401` email/password salah · `403` akun belum diverifikasi.

#### `POST /api/auth/forgot-password` — Public (rate-limit 5/jam)
Request:
```json
{ "email": "budi@kantor.com" }
```
Response 200 (selalu sukses, anti-enumerasi):
```json
{ "success": true, "message": "Jika email terdaftar, link reset sudah dikirim." }
```

#### `POST /api/auth/reset-password` — Public
Request:
```json
{ "token": "a1b2c3...", "password": "baruRahasia123" }
```
Response 200 / Error 400 token expired.

#### `GET /api/auth/me` — Login
Response 200:
```json
{ "success": true, "data": { "user": { "id":"...", "nama":"...", "email":"...", "role":"STAFF", "divisi":"Keuangan" } } }
```

#### `PATCH /api/auth/me` — Login
Request (field yang boleh diubah):
```json
{ "nama": "Budi S.", "divisi": "HR", "password": "baru123" }
```

#### `GET /api/auth/pending` — Admin
Response 200:
```json
{ "success": true, "data": { "users": [ { "id":"...", "nama":"...", "email":"...", "createdAt":"..." } ] } }
```

#### `GET /api/auth/users` — Admin
Query: `?role=STAFF&status=AKTIF` (opsional).

#### `PATCH /api/auth/users/:id/verify` — Admin
Request (opsional):
```json
{ "statusAkun": "AKTIF", "role": "STAFF" }
```

#### `PATCH /api/auth/users/:id` — Admin
Update role / statusAkun / data profil user lain.

---

### 3.2 Barang

#### `GET /api/barang` — Login
Query: `?search=pulpen&satuan=box&lowStock=true` (opsional).
Response 200:
```json
{
  "success": true,
  "data": {
    "barang": [
      { "id":"...", "kode":"A-0001", "nama":"Pulpen", "satuan":"buah", "stok":120, "stokMinimum":10, "gambarUrl":"https://..." }
    ]
  }
}
```

#### `GET /api/barang/:id` — Login
Response: detail satu barang.

#### `POST /api/barang` — Admin
Request:
```json
{
  "nama": "Pulpen Standard AE7",
  "kode": "A-0001",
  "deskripsi": "Tinta hitam 0.5mm",
  "satuan": "buah",
  "stok": 100,
  "stokMinimum": 10,
  "gambarUrl": "https://supabase.../barang/xxx.png"
}
```
Response 201 berisi object `barang` baru.

#### `PATCH /api/barang/:id` — Admin
Partial update (kirim field yang berubah saja).

#### `DELETE /api/barang/:id` — Admin
Response 200: `{ success:true, message:"Barang dihapus" }`.

#### `POST /api/upload` — Admin (multipart/form-data)
Form-data:
| Key | Tipe | Keterangan |
|-----|------|------------|
| `gambar` | File | Field file, max ~2 MB (lihat config) |

Response 200:
```json
{ "success": true, "data": { "url": "https://<supabase>/storage/v1/object/public/foto-barang/xxx.png" } }
```

---

### 3.3 Permintaan

#### `GET /api/permintaan` — Login
- Role `STAFF` → hanya milik sendiri.
- Role `ADMIN` / `PETUGAS` → semua.

Query: `?status=MENUNGGU_ADMIN` (opsional).

Response 200:
```json
{
  "success": true,
  "data": {
    "permintaan": [
      {
        "id":"...",
        "statusAdmin":"DISETUJUI_ADMIN",
        "createdAt":"...",
        "peminta": { "id":"...", "nama":"Budi", "divisi":"Keuangan" },
        "approver": { "id":"...", "nama":"Admin Siti" },
        "items": [
          { "id":"...", "jumlah":2, "barang": { "id":"...", "nama":"Kertas", "satuan":"rim" } }
        ],
        "tugasPetugas": [
          { "id":"...", "statusTugas":"ON_DELIVERY", "petugas":{ "id":"...", "nama":"Joko" } }
        ]
      }
    ]
  }
}
```

#### `GET /api/permintaan/:id` — Login
Response: detail + relasi (peminta, approver, items.barang, tugasPetugas).

#### `POST /api/permintaan` — Staff / Admin / Petugas
Request:
```json
{
  "items": [
    { "barangId": "<uuid-kertas>", "jumlah": 2 },
    { "barangId": "<uuid-pulpen>", "jumlah": 5 }
  ],
  "catatan": "Untuk keperluan audit"
}
```
Response 201 berisi permintaan + items.

Error:
- `400` items kosong atau jumlah < 1.
- `400` `barangId` tidak valid.

#### `PATCH /api/permintaan/:id/approve` — Admin
Request:
```json
{ "aksi": "APPROVE" }
```
atau
```json
{ "aksi": "REJECT", "catatan": "Stok kurang" }
```
Response 200: permintaan ter-update + tugas otomatis (jika APPROVE).

Error: `409` permintaan sedang dipegang admin lain (lock belum expire).

#### `PATCH /api/permintaan/:id/batal` — Staff
Hanya boleh selama `status_admin = MENUNGGU_ADMIN` & `peminta_id = user ini`.

---

### 3.4 Tugas Petugas

#### `GET /api/permintaan/tugas` — Admin / Petugas
Query: `?status=MENUNGGU_ASSIGN` · `?petugasId=me` (opsional).

Response 200:
```json
{
  "success": true,
  "data": {
    "tugas": [
      {
        "id":"...",
        "statusTugas":"MENUNGGU_ASSIGN",
        "permintaan": { "id":"...", "peminta":{"nama":"Budi"}, "items":[...] }
      }
    ]
  }
}
```

#### `PATCH /api/permintaan/tugas/:id/ambil` — Petugas
Response 200: tugas jadi `ON_DELIVERY`, `petugas_id = user`.

Error: `409` tugas sudah diambil petugas lain.

#### `PATCH /api/permintaan/tugas/:id/lepas` — Petugas
Hanya boleh oleh petugas yang memegang. Balik ke `MENUNGGU_ASSIGN`, `petugas_id = null`.

#### `PATCH /api/permintaan/tugas/:id` — Petugas (tandai selesai)
Request:
```json
{ "statusTugas": "DELIVERED", "lokasiTujuan": "Ruang Keuangan Lt.2" }
```
Response 200: tugas `DELIVERED`, stok tiap item berkurang, `log_stok` + `permintaan.status_admin = SELESAI`.

Error: `400` stok tidak cukup.

---

### 3.5 Restock (Admin)

#### `POST /api/restock` — Admin
Request:
```json
{
  "barangId": "<uuid>",
  "jumlah": 100,
  "sumber": "Pembelian PT Mitra",
  "tanggal": "2026-04-05"
}
```
Response 201: `stok_masuk` baru, `barang.stok` bertambah, `log_stok` `RESTOCK` ditulis.

#### `GET /api/restock` — Admin
Query: `?barangId=...&dari=2026-04-01&sampai=2026-04-30`.

---

### 3.6 Log Stok (Admin)

#### `GET /api/log-stok` — Admin
Query: `?barangId=...&jenis=APPROVE&dari=...&sampai=...`.

Response 200:
```json
{
  "success": true,
  "data": {
    "log": [
      { "id":"...", "perubahan":-5, "jenis":"APPROVE", "referensiId":"<permintaanId>", "barang":{"nama":"Pulpen"}, "admin":null, "createdAt":"..." }
    ]
  }
}
```

---

### 3.7 Laporan (Admin)

#### `GET /api/laporan` — Admin
Query: `?dari=2026-04-01&sampai=2026-04-30&barangId=...`.

Response 200 (ringkasan):
```json
{
  "success": true,
  "data": {
    "periode": { "dari":"...", "sampai":"..." },
    "totalPermintaan": 120,
    "totalDisetujui": 100,
    "totalDitolak": 10,
    "totalPengeluaranStok": 450,
    "totalRestock": 600,
    "topBarang": [ { "nama":"Kertas", "qty":80 } ]
  }
}
```

---

### 3.8 Dashboard (Admin)

#### `GET /api/admin/dashboard` — Admin
Response 200:
```json
{
  "success": true,
  "data": {
    "permintaanMenunggu": 5,
    "tugasMenungguAssign": 3,
    "tugasOnDelivery": 2,
    "barangStokMenipis": [ { "id":"...", "nama":"Kertas", "stok":3, "stokMinimum":10 } ],
    "pendingUsers": 1
  }
}
```

---

## 4. Contoh Pemakaian (cURL)

### Login & simpan token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kantor.com","password":"adminpass"}'
```

### Buat permintaan (pakai token)
```bash
TOKEN="eyJhbGciOi..."
curl -X POST http://localhost:3001/api/permintaan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "items":[{"barangId":"<uuid>","jumlah":2}] }'
```

### Upload gambar barang
```bash
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "gambar=@./pulpen.png"
```

---

## 5. Error Codes Khusus

| Pesan | HTTP | Penyebab |
|-------|------|----------|
| `Token tidak ada. Silakan login.` | 401 | Header Authorization tidak ada |
| `Token tidak valid atau kedaluwarsa.` | 401 | JWT invalid / expired |
| `Akses ditolak. Role tidak sesuai.` | 403 | Role user tidak match `requireRole` |
| `Minimal satu item barang` | 400 | `items[]` kosong |
| `Sedang diproses admin lain` | 409 | `assigned_admin_id` lock belum 10 menit |
| `Stok tidak cukup` | 400 | Barang stok < jumlah permintaan |
| `Terlalu banyak percobaan login` | 429 | Rate limit |

---

**Tools rekomendasi untuk testing API:**
- **Thunder Client** (VS Code/Cursor extension) — ringan.
- **Insomnia** / **Postman** — lebih lengkap.
- **cURL** di terminal — cocok buat screenshot laporan.
