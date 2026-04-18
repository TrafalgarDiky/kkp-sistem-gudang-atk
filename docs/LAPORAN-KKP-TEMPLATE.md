# LAPORAN KULIAH KERJA PRAKTEK (KKP)

> **Cara pakai file ini:**
> 1. Buka file ini di Cursor/VS Code.
> 2. Isi semua `<TODO: ...>`.
> 3. Copy-paste tiap BAB ke Word/Google Docs (formatting tetap karena pakai heading markdown).
> 4. Untuk gambar/diagram: buka file `02-ERD...md`, `03-ARSITEKTUR...md`, `04-USE-CASE...md` → preview → screenshot → paste ke Word di bagian yang sesuai.

---

## HALAMAN JUDUL

**JUDUL:**
`SISTEM INFORMASI GUDANG ATK BERBASIS WEB SERVICE MENGGUNAKAN NODE.JS, EXPRESS, DAN POSTGRESQL`

| Field | Isi |
|-------|-----|
| Disusun oleh | `<TODO: Nama Mahasiswa>` |
| NIM | `<TODO>` |
| Program Studi | `<TODO>` |
| Fakultas | `<TODO>` |
| Nama Kampus | `<TODO>` |
| Dosen Pembimbing | `<TODO>` |
| Tempat KKP | `<TODO: Nama Instansi/Perusahaan>` |
| Periode | `<TODO: Bulan–Bulan Tahun>` |
| Tahun Pengajuan | `<TODO: 2026>` |

---

## LEMBAR PENGESAHAN

> *(Format ini biasanya mengikuti template kampus. Copy template dari panduan KKP prodi Anda.)*

Laporan KKP ini telah disetujui dan disahkan pada tanggal `<TODO: dd-mm-yyyy>`.

**Dosen Pembimbing**          **Ketua Program Studi**

`<TODO: Nama>`                `<TODO: Nama>`
NIDN: `<TODO>`                NIDN: `<TODO>`

---

## KATA PENGANTAR

> *(Template singkat — sesuaikan gaya bahasa kampus Anda.)*

Puji syukur kepada Tuhan Yang Maha Esa atas rahmat-Nya sehingga penulis dapat menyelesaikan laporan Kuliah Kerja Praktek (KKP) yang berjudul **"Sistem Informasi Gudang ATK berbasis Web Service"** tepat waktu.

Laporan ini disusun sebagai pertanggungjawaban akademik atas pelaksanaan KKP di `<TODO: Instansi>` selama periode `<TODO: Bulan Tahun>`. Penulis mengucapkan terima kasih kepada:
1. `<TODO: Dosen Pembimbing>` selaku pembimbing akademik.
2. `<TODO: Pembimbing Lapangan>` di tempat KKP yang memberikan bimbingan teknis.
3. Keluarga dan rekan-rekan yang telah memberikan dukungan.

Penulis menyadari laporan ini masih jauh dari sempurna. Kritik dan saran sangat diharapkan.

`<TODO: Kota>`, `<TODO: tanggal>`

**Penulis**

---

## DAFTAR ISI

*(Update otomatis di Word setelah paste.)*

- KATA PENGANTAR
- DAFTAR ISI
- DAFTAR GAMBAR
- DAFTAR TABEL
- BAB I — PENDAHULUAN
- BAB II — TINJAUAN PUSTAKA
- BAB III — ANALISIS & PERANCANGAN SISTEM
- BAB IV — IMPLEMENTASI & PENGUJIAN
- BAB V — PENUTUP
- DAFTAR PUSTAKA
- LAMPIRAN

---

## BAB I — PENDAHULUAN

### 1.1 Latar Belakang

`<TODO: Ceritakan kondisi nyata di tempat KKP. Contoh di bawah.>`

Di `<TODO: Instansi>`, pengelolaan permintaan Alat Tulis Kantor (ATK) masih dilakukan secara semi-manual. Staff mengisi Google Form, admin gudang merekap ke Excel, dan notifikasi antar petugas dilakukan melalui WhatsApp. Cara ini menimbulkan beberapa masalah:

1. **Data tersebar** di beberapa tempat (Form, Excel, pesan WA) → rawan hilang dan tidak sinkron.
2. **Stok tidak akurat** karena update manual pasti terlambat.
3. **Tidak ada jejak audit** siapa yang menyetujui permintaan apa.
4. **Petugas gudang** tidak memiliki daftar tugas yang terstruktur.

Berdasarkan permasalahan tersebut, penulis membangun sebuah **Web Service** berbasis REST API menggunakan Node.js + Express + PostgreSQL, dengan aplikasi web **Next.js** sebagai client, yang memungkinkan Staff, Admin, dan Petugas mengelola seluruh proses secara digital dan ter-audit.

### 1.2 Rumusan Masalah

1. Bagaimana merancang Web Service REST API yang aman (JWT) untuk mengelola data permintaan ATK?
2. Bagaimana merancang model database yang mampu mencatat jejak transaksi (permintaan, restock, log stok) secara auditable?
3. Bagaimana mengintegrasikan Web Service tersebut dengan aplikasi web yang responsive (dapat diakses dari laptop dan HP)?

### 1.3 Tujuan

1. Membangun **Web Service** (REST API) yang menyediakan endpoint untuk registrasi, autentikasi, manajemen barang, permintaan, dan pelaporan.
2. Merancang **database relasional** (PostgreSQL) yang menormalisasi data hingga bentuk normal ke-3 (3NF).
3. Membangun **aplikasi web** (Next.js) yang mengkonsumsi API dan dapat diakses multi-platform.

### 1.4 Manfaat

**Bagi Instansi:**
- Mempercepat proses permintaan ATK (real-time, tanpa rekap manual).
- Stok lebih akurat dan ada jejak audit.

**Bagi Penulis:**
- Menerapkan ilmu pemrograman (backend REST API, database, frontend).
- Memperoleh pengalaman pembangunan sistem end-to-end.

**Bagi Akademik:**
- Menambah referensi implementasi Web Service berbasis Node.js.

### 1.5 Batasan Masalah

1. Sistem dibuat hanya untuk **satu gudang** (tidak multi-lokasi).
2. Notifikasi dibatasi pada **in-app** (tidak push WhatsApp/email, kecuali email reset password).
3. Ekspor laporan **tidak** ke PDF/Excel otomatis.
4. Aplikasi **mobile native** (APK) hanya skeleton (fase 2).
5. Stok barang tidak punya varian / batch / kadaluarsa.

### 1.6 Sistematika Penulisan

- **BAB I** memuat latar belakang, rumusan masalah, tujuan, manfaat, batasan, dan sistematika penulisan.
- **BAB II** membahas teori dasar: Web Service, REST, JWT, Node.js, PostgreSQL, Prisma ORM, dan Next.js.
- **BAB III** menjelaskan analisis kebutuhan dan perancangan: PRD, arsitektur, ERD, use case, dan flowchart.
- **BAB IV** menampilkan hasil implementasi, screenshot aplikasi, cuplikan kode, dan hasil pengujian.
- **BAB V** berisi kesimpulan dan saran.

---

## BAB II — TINJAUAN PUSTAKA

### 2.1 Web Service

Web Service adalah sebuah perangkat lunak yang memungkinkan dua aplikasi berbeda berkomunikasi melalui jaringan, umumnya menggunakan protokol HTTP. Client mengirim *request*, server membalas *response* dalam format data terstruktur (JSON/XML).

### 2.2 REST (Representational State Transfer)

REST adalah arsitektur untuk membangun Web Service yang:
- **Stateless** — server tidak menyimpan state antar-request.
- **Uniform interface** — pakai HTTP method standar (GET, POST, PATCH, DELETE).
- **Resource-oriented** — setiap data diidentifikasi dengan URL unik.

### 2.3 JSON (JavaScript Object Notation)

Format pertukaran data berbasis teks yang ringan dan mudah dibaca baik oleh manusia maupun mesin.

```json
{ "success": true, "message": "Login berhasil", "data": { "token": "..." } }
```

### 2.4 JWT (JSON Web Token)

Token yang ditandatangani secara digital yang berisi informasi user. Digunakan sebagai identitas di request stateless. Terdiri dari 3 bagian: *header*, *payload*, *signature*, dipisahkan dengan titik.

### 2.5 Node.js & Express

- **Node.js** — runtime JavaScript di server (di luar browser).
- **Express.js** — framework minimalis untuk membangun REST API di atas Node.js.

### 2.6 PostgreSQL & Prisma ORM

- **PostgreSQL** — relational database open source, mendukung ACID transactions.
- **Prisma ORM** — *Object-Relational Mapper* yang menjembatani JavaScript object dengan tabel SQL. Keuntungan: type-safety, auto-migration, query builder yang ekspresif.

### 2.7 Next.js

Framework React untuk membangun aplikasi web modern dengan fitur *Server-Side Rendering*, *App Router*, dan *file-based routing*.

### 2.8 Arsitektur 3-Tier

Pemisahan sistem menjadi 3 lapisan:
1. **Presentation** (UI) — Next.js.
2. **Application** (logic) — Express API.
3. **Data** (penyimpanan) — PostgreSQL.

### 2.9 Bcrypt (Hashing Password)

Algoritma hashing satu-arah yang dirancang lambat secara sengaja sehingga tahan terhadap serangan brute-force. Penyimpanan password wajib di-hash, **tidak pernah** dalam bentuk plain-text.

### 2.10 Rate Limiting

Mekanisme pembatasan jumlah request per IP dalam periode waktu tertentu untuk mencegah *abuse* dan *brute force*.

> **TODO:** Tambahkan referensi buku/jurnal tiap subbab sesuai gaya sitasi kampus (APA/IEEE). Contoh: `(Fielding, 2000)`, `(Mozilla Developer Network, 2024)`.

---

## BAB III — ANALISIS & PERANCANGAN SISTEM

### 3.1 Analisis Kebutuhan

#### 3.1.1 Kebutuhan Fungsional

`<Salin tabel fitur MVP dari 01-PRD.md §4.1 ke sini.>`

#### 3.1.2 Kebutuhan Non-Fungsional

`<Salin tabel dari 01-PRD.md §6 ke sini.>`

#### 3.1.3 Identifikasi Aktor

| Aktor | Peran |
|-------|-------|
| Staff | Membuat permintaan, memantau status |
| Admin | Verifikasi akun, kelola barang, approve/tolak, restock, laporan |
| Petugas | Antar barang, konfirmasi selesai |
| Sistem | Auto kurangi stok + tulis log saat tugas selesai |

### 3.2 Perancangan Sistem

#### 3.2.1 Arsitektur Sistem (3-Tier)

*(Masukkan **Gambar 3.1** → screenshot diagram dari `03-ARSITEKTUR-SISTEM.md §1`.)*

Sistem terdiri dari tiga lapisan: **Presentation** (Next.js di Vercel), **Application** (Express di Railway), dan **Data** (PostgreSQL & Storage di Supabase).

#### 3.2.2 Arsitektur Deployment

*(Masukkan **Gambar 3.2** → screenshot dari `03-ARSITEKTUR-SISTEM.md §4`.)*

Aplikasi di-*deploy* ke tiga platform cloud gratis: Vercel (frontend), Railway (backend), Supabase (database + storage).

### 3.3 Use Case Diagram

*(Masukkan **Gambar 3.3** → screenshot dari `04-USE-CASE-DAN-ALUR.md §1`.)*

Terdapat 4 aktor utama (Staff, Admin, Petugas, Sistem) dengan total **18 use case**.

### 3.4 Activity / Flowchart Diagram

*(Masukkan **Gambar 3.4** → screenshot dari `04-USE-CASE-DAN-ALUR.md §3`.)*

Alur utama: Staff membuat permintaan → Admin approve → Petugas antar → Sistem otomatis mengurangi stok dan menulis log.

### 3.5 State Diagram

*(Masukkan **Gambar 3.5 & 3.6** — state diagram permintaan & tugas dari `04-USE-CASE-DAN-ALUR.md §5 & §6`.)*

### 3.6 Perancangan Database

#### 3.6.1 Entity Relationship Diagram (ERD)

*(Masukkan **Gambar 3.7** → screenshot dari `02-ERD-DAN-KAMUS-DATA.md §1`.)*

Terdapat **7 entitas utama** dan **1 enum set**.

#### 3.6.2 Kamus Data

`<Salin tabel kolom-kolom dari 02-ERD-DAN-KAMUS-DATA.md §3 ke sini.>`

### 3.7 Perancangan Antarmuka (UI Wireframe)

*(Screenshot mock-up / halaman final dari tiap role: Staff, Admin, Petugas. Ambil dari aplikasi jadi.)*

---

## BAB IV — IMPLEMENTASI & PENGUJIAN

### 4.1 Lingkungan Implementasi

| Komponen | Versi |
|----------|-------|
| OS Development | `<TODO: Windows 10 / Ubuntu 22.04>` |
| Node.js | `<TODO: v20.x>` |
| Express.js | 4.x |
| Prisma | `<TODO>` |
| PostgreSQL | 15.x (Supabase) |
| Next.js | `<TODO>` |
| Editor | Cursor / VS Code |

### 4.2 Implementasi Backend (Web Service)

#### 4.2.1 Struktur Folder

`<Salin dari 03-ARSITEKTUR-SISTEM.md §2 — "Struktur Folder Backend".>`

#### 4.2.2 Konfigurasi Database (Prisma)

*(Cuplikan kode dari `backend/prisma/schema.prisma` — 10–15 baris contoh tabel `Permintaan`.)*

#### 4.2.3 Middleware Autentikasi

*(Cuplikan kode dari `backend/src/middleware/authMiddleware.js`.)*

#### 4.2.4 Endpoint REST API

`<Salin tabel ringkas endpoint dari 05-API-SPEC.md §2.>`

#### 4.2.5 Contoh Implementasi Endpoint: Buat Permintaan

*(Cuplikan kode `createPermintaan` dari `backend/src/controllers/permintaanController.js`.)*

### 4.3 Implementasi Frontend (Web Client)

#### 4.3.1 Struktur Halaman

`<Salin dari 03-ARSITEKTUR-SISTEM.md §3.>`

#### 4.3.2 Contoh Halaman: Katalog Barang

*(Screenshot halaman barang + cuplikan kode `frontend/app/(app)/barang/page.js`.)*

### 4.4 Deployment

1. **Backend** — Railway, URL: `<TODO: https://atk-api.up.railway.app>`
2. **Frontend** — Vercel, URL: `<TODO: https://atk-frontend.vercel.app>`
3. **Database** — Supabase PostgreSQL, region: `<TODO: Singapore>`
4. **Storage** — Supabase Storage, bucket: `<TODO: foto-barang>`

### 4.5 Pengujian

#### 4.5.1 Pengujian Fungsional (Skenario End-to-End)

| No | Skenario | Hasil Diharapkan | Status |
|----|----------|------------------|:------:|
| 1 | Staff register + admin verifikasi | Akun jadi `AKTIF` | `<TODO: ✓>` |
| 2 | Staff login → dapat JWT | Token terkirim | `<TODO: ✓>` |
| 3 | Staff buat permintaan 2 item | Permintaan tersimpan, status `MENUNGGU_ADMIN` | `<TODO: ✓>` |
| 4 | Admin approve | Status `DISETUJUI_ADMIN` + tugas petugas dibuat | `<TODO: ✓>` |
| 5 | Petugas ambil tugas | `ON_DELIVERY` | `<TODO: ✓>` |
| 6 | Petugas selesai | Stok berkurang + log tercatat | `<TODO: ✓>` |
| 7 | Admin restock | Stok bertambah + log `RESTOCK` | `<TODO: ✓>` |
| 8 | Staff akses `/api/admin/dashboard` | 403 Forbidden | `<TODO: ✓>` |
| 9 | Login 11× salah password | 429 Too Many Requests | `<TODO: ✓>` |

#### 4.5.2 Pengujian Multi-Platform (Syarat Web Service)

1. **Platform 1 — Web Next.js (laptop)**: *(screenshot)*
2. **Platform 2 — Browser HP atau Postman**: *(screenshot)*

Hasil: API yang sama berhasil dipanggil dari dua *client* berbeda → **memenuhi kriteria Web Service multi-platform**.

#### 4.5.3 Pengujian Keamanan

| Aspek | Bukti |
|-------|-------|
| Password di-hash | Screenshot kolom `password_hash` berisi hash `$2b$10$...` |
| JWT wajib | Request tanpa header → 401 |
| Role berlapis | Staff akses endpoint admin → 403 |
| Rate limit login | Spam 11× login → 429 |

---

## BAB V — PENUTUP

### 5.1 Kesimpulan

1. Sistem Informasi Gudang ATK berhasil dibangun sebagai **Web Service REST** menggunakan Node.js + Express + PostgreSQL, dengan aplikasi web Next.js sebagai client.
2. Autentikasi **JWT** dan **rate limiting** memenuhi kebutuhan keamanan dasar Web Service.
3. Database terdiri dari **7 tabel utama** yang telah dinormalisasi hingga 3NF.
4. Seluruh **15 fitur MVP** di PRD berhasil diimplementasikan dan diuji *end-to-end*.
5. API berhasil dipanggil dari **dua platform berbeda** (web Next.js + `<TODO: Postman/Mobile Browser>`), memenuhi syarat KKP bertema Web Service.

### 5.2 Saran Pengembangan

1. Menambahkan notifikasi **WhatsApp / Email push** untuk permintaan baru.
2. Mengembangkan aplikasi **mobile React Native** untuk petugas agar bisa memanfaatkan GPS & notifikasi push.
3. Menambah fitur **ekspor laporan PDF / Excel** untuk kebutuhan audit bulanan.
4. Mendukung **multi-gudang / multi-lokasi** untuk instansi skala besar.
5. Integrasi **barcode / QR code** pada barang agar *scan* lebih cepat.

---

## DAFTAR PUSTAKA

> *(Ganti gaya sitasi sesuai panduan kampus. Minimal 10 pustaka — campur buku, jurnal, web.)*

1. Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures*. Doctoral dissertation, University of California, Irvine.
2. Mozilla Developer Network. (2024). *HTTP — Hypertext Transfer Protocol*. Diakses dari https://developer.mozilla.org/en-US/docs/Web/HTTP
3. PostgreSQL Global Development Group. (2024). *PostgreSQL 15 Documentation*. Diakses dari https://www.postgresql.org/docs/15/
4. Prisma. (2024). *Prisma ORM Documentation*. Diakses dari https://www.prisma.io/docs
5. Vercel. (2024). *Next.js Documentation*. Diakses dari https://nextjs.org/docs
6. Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)*. RFC 7519.
7. `<TODO: tambah 4 pustaka lagi sesuai panduan kampus>`.

---

## LAMPIRAN

### Lampiran A — Spesifikasi API Lengkap
Isi: salin seluruh `docs/05-API-SPEC.md`.

### Lampiran B — Source Code
Isi: screenshot struktur folder `backend/` dan `frontend/` + link repository GitHub `<TODO: url-repo>`.

### Lampiran C — Screenshot Implementasi
Isi: lihat checklist screenshot di `docs/06-CHECKLIST-KKP.md §3`.

### Lampiran D — Hasil Pengujian
Isi: tabel pengujian dari BAB IV §4.5 dengan bukti screenshot tiap baris.
