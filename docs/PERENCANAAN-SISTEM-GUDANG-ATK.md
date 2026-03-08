# Perencanaan Sistem Gudang ATK

Dokumen ini berisi: pertanyaan requirement, PRD mini, arsitektur, dan rancangan database.  
**Tujuan:** Mengunci scope sebelum coding agar tidak salah arah.

---

## 1. Pertanyaan Penting untuk Mengunci Requirement

Jawab pertanyaan ini dulu (boleh singkat). Ini membantu kita sama-sama paham apa yang dibangun.

### A. Pengguna & Role
1. **Siapa saja yang boleh mendaftar sebagai Staff?**  
   - Hanya karyawan internal (ada daftar NIP/email)? Atau siapa saja bisa daftar lalu admin yang verifikasi?

2. **Admin Gudang (2–3 orang):**  
   - Apakah mereka hanya approve permintaan + kelola stok, atau juga boleh mengubah data barang (nama, gambar, satuan)?

3. **Petugas Gudang (2 orang):**  
   - Apakah mereka **hanya** melihat tugas & mengantarkan, atau juga boleh mengubah status stok (misal: konfirmasi “sudah diambil dari gudang”)?

### B. Alur Permintaan & Notifikasi
4. **Notifikasi ke Petugas:**  
   - Saat staff buat permintaan, petugas dapat notif. Jika admin tidak ada, petugas bisa proses tanpa approve.  
   - Notifikasi mau lewat apa? (WhatsApp, email, in-app saja, atau kombinasi?)

5. **“Tanpa menunggu approve”:**  
   - Jika petugas mengantarkan tanpa approve admin, apakah stok barang **tetap berkurang otomatis** di sistem, atau stok hanya berkurang kalau admin yang approve?

6. **Satu permintaan = satu staff atau bisa banyak item?**  
   - Satu form permintaan berisi banyak barang (item A, B, C) sekaligus, atau satu permintaan = satu jenis barang?

### C. Barang & Stok
7. **Gambar barang:**  
   - Siapa yang mengupload gambar barang (admin saja)? Apakah wajib ada gambar atau boleh kosong?

8. **Satuan barang:**  
   - Apa saja satuan yang dipakai? (box, pack, lembar, buah, botol, dll.) — apakah tetap atau bisa ditambah oleh admin?

### D. Teknis & Lingkungan
9. **Hosting & akses:**  
   - Akan dijalankan di mana? (lokal kantor, VPS, cloud?) Dan apakah staff/petugas hanya akses lewat WiFi kantor atau juga dari luar (mobile data)?

10. **APK untuk Petugas:**  
    - Untuk MVP, apakah cukup **web responsive** (buka di browser HP) dulu, baru nanti tahap 2 bikin APK (React Native / PWA)? Atau APK wajib masuk MVP?

---

Setelah pertanyaan di atas dijawab, kita bisa menyesuaikan PRD dan database kalau ada yang berubah.

---

## 2. PRD Mini + Daftar Fitur MVP

### Visi Singkat
Sistem Gudang ATK menggantikan alur Google Form + Excel dengan:  
- Staff daftar & minta ATK lewat web;  
- Admin approve & kelola stok (terlihat siapa yang approve);  
- Petugas dapat notif & tugas pengambilan/pengantaran (bisa proses dengan atau tanpa menunggu approve admin);  
- Barang punya katalog dengan gambar agar staff tidak bingung.

### Daftar Fitur MVP (Fase 1)

| No | Fitur | Siapa | Keterangan |
|----|--------|------|------------|
| 1 | Registrasi & Login | Staff, Admin, Petugas | Role dipilih saat registrasi atau ditentukan admin. |
| 2 | Katalog barang (list + gambar + stok) | Semua (baca) | Staff bisa lihat barang sebelum minta. |
| 3 | CRUD barang + upload gambar + kelola stok | Admin | Hanya admin yang bisa tambah/edit/hapus barang. |
| 4 | Buat permintaan ATK (pilih barang + jumlah) | Staff | Satu permintaan bisa banyak item. |
| 5 | Daftar permintaan (list + filter status) | Admin, Petugas | Status: menunggu, disetujui, ditolak, sedang diproses, selesai. |
| 6 | Approve / tolak permintaan (dan catat admin yang approve) | Admin | Saat approve, stok berkurang. |
| 7 | Notifikasi ke Petugas saat ada permintaan baru | Petugas | In-app (MVP); tambahan WhatsApp/email bisa fase 2. |
| 8 | Tugas pengambilan/pengantaran (detail permintaan + lokasi/staff) | Petugas | Petugas bisa lihat daftar tugas dan ubah status (sedang diambil, dalam pengiriman, selesai). |
| 9 | Opsi: Petugas proses tanpa approve admin | Petugas | Jika diinginkan: petugas bisa “proses” permintaan dan stok tetap berkurang (atau sesuai jawaban pertanyaan no. 5). |
| 10 | Tampilan responsive (mobile) untuk Petugas | Petugas | Web yang nyaman dipakai di HP; APK bisa fase 2. |

**Sengaja tidak masuk MVP (bisa nanti):**  
- Laporan/rekap Excel;  
- Notifikasi WhatsApp/email;  
- APK native;  
- Multi-gudang/lokasi.

---

## 3. Arsitektur: Backend Terpisah (Express) vs Next.js API Routes

### Opsi A: Backend terpisah (Node.js + Express)

- **Struktur:** Satu repo/codebase untuk **API saja** (Express), satu lagi untuk **frontend** (Next.js).  
- Frontend memanggil API lewat URL, misal: `https://api.kantor.com/gudang-atk`.

**Plus untuk pemula:**
- Pemisahan jelas: “ini API, ini tampilan.”
- Bisa dipelajari satu per satu (Express dulu, lalu React).
- API bisa dipakai nanti oleh banyak client (web, APK, dll.) dengan satu codebase.

**Minus:**
- Harus jalankan dua proses (backend + frontend) saat development.
- Perlu atur CORS dan URL environment (development vs production).
- Deploy dua tempat (atau satu server dengan dua service).

---

### Opsi B: Next.js API Routes (Backend di dalam Next.js)

- **Struktur:** Satu project Next.js. Halaman di `app/` atau `pages/`, endpoint API di `app/api/...` atau `pages/api/...`.  
- Frontend memanggil `/api/permintaan`, `/api/barang`, dll. di domain yang sama.

**Plus untuk pemula:**
- Satu repo, satu `npm run dev`, satu deploy.
- Tidak perlu atur CORS untuk same-origin.
- Cocok untuk tim kecil dan MVP.

**Minus:**
- API “menempel” ke project Next.js; kalau nanti mau APK yang hit API yang sama, tetap bisa (APK cukup hit URL `/api/...`).
- Untuk scale sangat besar, memisahkan API ke service terpisah bisa jadi pilihan nanti.

---

### Rekomendasi untuk kamu (pemula, MVP)

- **Gunakan Next.js API Routes** dulu.  
- Alasan: satu project, satu perintah jalan, lebih sederhana untuk belajar dan deploy.  
- Nanti jika butuh APK, APK cukup memanggil `https://domain-kamu.com/api/...` (sama seperti frontend).

**Ringkas:**  
- **Next API Routes** = backend + frontend dalam satu aplikasi Next.js.  
- **Express terpisah** = backend dan frontend dua aplikasi terpisah.

---

## 4. Rancangan Database Awal (PostgreSQL)

Asumsi umum (bisa disesuaikan setelah jawaban pertanyaan di atas):

- Satu permintaan bisa berisi **banyak item** (barang + jumlah).
- Stok berkurang saat **approve** (atau saat petugas proses, jika aturannya begitu).
- Ada riwayat **siapa admin yang approve**.

### Tabel inti

| Tabel | Fungsi |
|-------|--------|
| **users** | Semua pengguna: staff, admin, petugas. Login & role. |
| **barang** | Katalog ATK: nama, satuan, stok, gambar, dll. |
| **permintaan** | Satu “surat” permintaan dari satu staff (tanggal, status, siapa yang approve). |
| **permintaan_item** | Detail per barang di satu permintaan (barang_id, jumlah). |
| **riwayat_stok** (opsional MVP) | Log penambahan/pengurangan stok untuk audit. |

### Relasi singkat

- **users** — one-to-many → **permintaan** (satu staff banyak permintaan).  
- **permintaan** — many-to-many dengan **barang** lewat **permintaan_item** (satu permintaan banyak item, satu item = satu barang + jumlah).  
- **permintaan** menyimpan `approved_by` (user_id admin yang approve) dan `status`.

### Skema ringkas (untuk gambaran)

```
users
  - id (PK)
  - email, password_hash, nama, role (staff | admin | petugas)
  - created_at, updated_at

barang
  - id (PK)
  - nama, satuan, stok, gambar_url (nullable)
  - created_at, updated_at

permintaan
  - id (PK)
  - user_id (FK → users)   # staff yang minta
  - status (draft | menunggu | disetujui | ditolak | diproses | selesai)
  - approved_by (FK → users, nullable)   # admin yang approve
  - approved_at (nullable)
  - catatan (opsional)
  - created_at, updated_at

permintaan_item
  - id (PK)
  - permintaan_id (FK → permintaan)
  - barang_id (FK → barang)
  - jumlah (integer)
  - created_at
```

**Catatan:**
- `riwayat_stok` bisa ditambah nanti: setiap stok barang berubah, insert satu baris (barang_id, jumlah +/- , permintaan_id atau keterangan).
- Untuk “petugas proses tanpa approve”, aturan bisnis (apakah stok berkurang, siapa isi `approved_by`) bisa kita tetapkan setelah kamu jawab pertanyaan no. 5.

---

## Langkah Berikutnya

1. **Kamu jawab** pertanyaan di bagian 1 (boleh singkat).  
2. **Kita sesuaikan** (kalau perlu) PRD dan skema database.  
3. **Setelah oke,** kita mulai **Step 1: Setup project** (init Next.js, PostgreSQL, struktur folder, env).

Jika ada pertanyaan dari bagian 2, 3, atau 4 yang mau didalami, tulis saja nomor bagian dan pertanyaannya.

Baik, ini jawabanmu sudah sangat membantu. Kita kunci dulu requirement-nya, lalu saya tunjukkan rancangan akhir sebelum mulai setup project.
1) Konfirmasi jawabanmu (disingkat, biar sama-sama jelas)
[1] Registrasi staff:
Siapa saja bisa daftar → akun belum aktif sampai admin memverifikasi.
[2] Admin & barang:
Admin boleh mengubah data barang (nama, gambar, satuan, dll).
[3] Petugas & alur kerja:
Petugas menerima tugas setelah ada permintaan.
Petugas boleh ambil & antar barang walaupun belum di-approve admin (fallback kalau admin tidak ada).
[4] Notifikasi:
MVP: in-app notification dulu.
Nanti boleh ditambah WA/email.
[5] Stok berkurang:
Kamu tulis: “stok berkurang ketika admin approve dan petugas selesai mengantarkan”.
Untuk menyederhanakan, saya akan ambil asumsi:
→ stok hanya berkurang sekali, pada saat petugas menandai tugas “selesai” (setelah di-approve admin atau diproses langsung petugas).
(Kalau nanti mau diubah, masih bisa.)
[6] Isi permintaan:
Satu permintaan bisa punya banyak item (banyak barang + jumlah berbeda).
[7] Gambar barang:
Hanya admin yang upload, dan boleh kosong (nanti bisa diisi/diubah).
[8] Satuan barang:
Satuan bisa ditambah oleh admin (tidak fixed).
[9] Hosting & akses:
Untuk KKP, sebaiknya bisa diakses dari mana saja (internet), tidak hanya jaringan kantor.
Saran konkret ada di poin 5 di bawah.
[10] Platform petugas:
MVP: web responsive di browser HP.
APK (mobile app) → nanti, setelah web jalan.
Status tugas petugas:
Untuk petugas cukup: “dalam proses” dan “selesai”.
Arsitektur dipilih: Opsi A (Backend Express terpisah) karena tuntutan KKP:
API/web service jelas,
ada security (JWT),
bisa dipakai di 2 platform (web + mobile),
arsitektur & endpoint harus terdokumentasi.
Semua ini cocok sekali dengan tema Web Service yang diminta kampus.
2) PRD Mini (direvisi sesuai jawaban)
Tujuan singkat:
Membangun Web Service Gudang ATK dengan backend Node.js (Express) + PostgreSQL, yang menyediakan API aman (JWT) untuk:
Staff: daftar, login, lihat katalog dengan gambar, buat permintaan ATK (multi-item), cek status permintaan.
Admin: verifikasi akun baru, kelola barang & stok, approve/tolak permintaan, melihat siapa yang memproses.
Petugas: melihat daftar tugas permintaan, mulai tugas (“dalam proses”), menandai selesai → stok berkurang.
Fitur MVP (dirapikan sedikit):
Auth & User Management
Registrasi umum (siapa saja), dengan status BELUM_VERIFIKASI.
Login dengan JWT (token yang dibawa di header setiap request).
Peran (role): STAFF, ADMIN, PETUGAS.
Admin bisa verifikasi user → user aktif boleh pakai sistem.
Manajemen Barang
Admin: CRUD barang (nama, deskripsi singkat, satuan, stok awal, gambar opsional).
Staff & Petugas: hanya bisa lihat katalog barang (dengan gambar bila ada).
Permintaan ATK
Staff membuat permintaan: satu permintaan, banyak item barang + jumlah.
Status permintaan (untuk admin/staff):
MENUNGGU_ADMIN, DISETUJUI_ADMIN, DITOLAK_ADMIN, SELESAI.
Admin bisa approve/tolak:
Saat approve → permintaan boleh dikerjakan petugas.
Saat tolak → permintaan selesai dengan status ditolak (tidak ada stok berkurang).
Tugas Petugas
Saat ada permintaan baru, petugas melihatnya di daftar tugas (menurut aturan kita: petugas boleh mulai walau admin belum approve, ini akan kita tandai di field tertentu).
Untuk petugas cukup: status tugas DALAM_PROSES, SELESAI.
Saat petugas menandai SELESAI → stok barang berkurang sesuai jumlah item di permintaan.
Notifikasi In-App
Minimal:
Petugas punya halaman “Daftar Permintaan Baru / Belum Dikerjakan”.
Bisa ada badge/jumlah “permintaan belum diproses”.
Nanti (fase berikut): push notif atau integrasi lain.
Multi-platform (syarat KKP)
API (Express) dirancang umum: dikonsumsi oleh:
Frontend web Next.js.
Nanti: aplikasi mobile (misal React Native) atau mobile web yang berbeda.
3) Arsitektur Akhir (sesuai syarat Web Service)
Istilah singkat:
API / Web Service: pintu komunikasi data; client kirim request (misalnya HTTP GET /api/barang), server balas response (biasanya JSON).
Client: aplikasi yang memanggil API (contoh: web Next.js, aplikasi mobile).
JWT (JSON Web Token): token berisi identitas user yang sudah login, ditandatangani rahasia. Client simpan & kirim di header Authorization: Bearer <token>.
Komponen:
Backend (Web Service) – Node.js + Express + PostgreSQL
Menyediakan endpoint seperti:
POST /api/auth/register, POST /api/auth/login
GET /api/barang, POST /api/barang, ...
POST /api/permintaan, GET /api/permintaan, ...
POST /api/tugas/:id/selesai, dll.
Menggunakan:
ORM (saran: Prisma) untuk akses PostgreSQL.
JWT untuk autentikasi.
Validasi input di setiap endpoint.
Response konsisten { success, message, data } (sesuai rule kamu).
Frontend Web – Next.js (React)
Untuk pengguna manusia (Staff/Admin/Petugas).
Hanya bertugas:
Menampilkan UI,
Memanggil API backend,
Mengelola sesi (simpan token JWT di sisi client secara aman).
Client kedua (untuk memenuhi syarat “2 platform”) – nanti:
Bisa web mobile khusus petugas atau React Native yang juga konsumsi API yang sama.
Pengujian:
Web (Next.js)
Mobile (apk atau web mobile di browser HP yang berbeda platform).
Kenapa pilihan ini cocok untuk KKP-mu:
a. Bisa digunakan di beberapa platform → API Express bisa dipakai web + mobile.
d, g, l, n, p. Security & arsitektur jelas → kita pakai JWT, definisikan arsitektur, diagram, dan daftar endpoint di bab III/IV.
h, o. 2 platform & pengujian → web Next.js + satu client tambahan (nanti), tanpa Postman.
m. API dibuat sendiri → semua endpoint kita desain dan buat dari nol.
4) Rancangan Database (direvisi)
Tetap pakai PostgreSQL, dengan tambahan kolom/relasi:
users
id
nama
email
password_hash
role (STAFF | ADMIN | PETUGAS)
status_akun (BELUM_VERIFIKASI | AKTIF | DITOLAK)
created_at, updated_at
barang
id
nama
deskripsi (opsional)
satuan (string, bebas; admin bisa isi “box”, “pack”, “lembar”, dst)
stok (integer, stok fisik saat ini)
gambar_url (nullable)
created_at, updated_at
permintaan
id
peminta_id (FK → users.id, role STAFF)
status_admin → enum:
MENUNGGU_ADMIN, DISETUJUI_ADMIN, DITOLAK_ADMIN, SELESAI
approved_by (FK → users.id, nullable; admin yang approve)
approved_at (nullable)
catatan_admin (nullable)
created_at, updated_at
permintaan_item
id
permintaan_id (FK → permintaan.id)
barang_id (FK → barang.id)
jumlah (integer)
created_at
tugas_petugas (baru, untuk flow petugas)
id
permintaan_id (FK → permintaan.id)
petugas_id (FK → users.id, role PETUGAS) — bisa nullable kalau tugas belum diambil oleh petugas tertentu.
status_tugas (DALAM_PROSES, SELESAI)
dibuat_otomatis (boolean; true kalau otomatis saat permintaan dibuat)
created_at, updated_at
Aturan bisnis yang ditanam di DB:
Saat staff membuat permintaan:
Insert permintaan + permintaan_item.
Insert minimal satu tugas_petugas (tanpa petugas_id, status DALAM_PROSES?) → atau status awal khusus, nanti kita detailkan di tahap implementasi.
Saat petugas set tugas → SELESAI:
Sistem:
Mengurangi barang.stok sesuai total jumlah di permintaan_item.
Mengubah permintaan.status_admin ke SELESAI (kalau belum).
Nanti, waktu implementasi, kita akan bikin logika ini di satu service function supaya mudah diuji dan dijelaskan di laporan.
5) Saran Hosting (untuk KKP, bisa diakses di mana saja)
Untuk kuliah kerja praktek / tugas akhir, yang penting:
Bisa diakses dari luar kampus (via internet).
Tidak ribet di-setup.
Saran sederhana:
PostgreSQL: pakai layanan gratis/low-cost seperti (contoh) Supabase / Railway / Render PostgreSQL (pilih yang kamu nyaman; nanti saya bantu langkah detail).
Backend Express:
Deploy ke platform seperti Render / Railway / VPS kecil.
Akan punya URL seperti https://atk-api.onrender.com.
Frontend Next.js:
Deploy ke Vercel / Netlify.
Akan punya URL seperti https://atk-frontend.vercel.app.
Web dan (nanti) mobile cukup memanggil URL API itu → memenuhi kriteria multi-platform.
Kalau kamu mau, nanti di bagian akhir kita juga bisa bikin diagram arsitektur untuk dimasukkan ke laporan (BAB III).
6) Next step: mulai Step 1 (setup project)
Kalau kamu setuju dengan rancangan di atas, next step dari saya (sesuai gaya mentor, pelan-pelan):
Step 1 (rencana): Setup backend (Web Service API)
Buat folder backend, misalnya backend/.
Inisialisasi project Node.js + Express (package.json, struktur awal).
Setup koneksi ke PostgreSQL (pilih ORM → saya sarankan Prisma karena cukup ramah pemula).
Buat endpoint sangat sederhana dulu (contoh: GET /api/health).
Sesuai permintaanmu:
Saya akan tulis rencana 3–7 langkah,
Sebut file/folder yang dibuat,
Belum langsung banyak kode, kita cicil, dan setiap blok kode saya jelaskan.
Pertanyaan terakhir sebelum lanjut:
Apakah kamu setuju memakai Prisma sebagai ORM (alat bantu akses database) di backend?
Kalau iya, di respon berikutnya saya mulai Step 1: setup project backend dengan menjelaskan langkah demi langkah.