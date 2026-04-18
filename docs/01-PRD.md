# PRD — Sistem Gudang ATK

> **PRD (Product Requirements Document)** = dokumen yang menjelaskan **apa yang dibangun, untuk siapa, dan kenapa**. Dosen/pembimbing pakai dokumen ini untuk menilai *scope* dan tujuan proyek.

## Identitas KKP

| Field | Isi |
|-------|-----|
| Nama Mahasiswa | `<TODO: isi>` |
| NIM | `<TODO: isi>` |
| Program Studi | `<TODO: isi>` |
| Fakultas | `<TODO: isi>` |
| Kampus | `<TODO: isi>` |
| Dosen Pembimbing | `<TODO: isi>` |
| Tempat KKP | `<TODO: isi nama instansi/perusahaan>` |
| Periode KKP | `<TODO: mis. Maret–Mei 2026>` |

## Metadata Dokumen

| Info | Keterangan |
|------|------------|
| Nama Proyek | Sistem Informasi Gudang ATK berbasis Web Service |
| Versi Dokumen | 1.0 |
| Tanggal | April 2026 |
| Jenis | Kuliah Kerja Praktek (KKP) |
| Tema | Web Service (REST API) |

---

## 1. Latar Belakang

Proses permintaan ATK (Alat Tulis Kantor) saat ini masih manual:
- Staff mengisi **Google Form**.
- Admin gudang merekap ke **Excel**.
- Stok sulit dipantau *real-time*, gambar barang tidak ada, alur approve tidak ter-audit.

Masalah yang muncul:
1. **Data tersebar** (Form → Excel → WhatsApp) sehingga rawan hilang/typo.
2. **Stok tidak akurat** karena update manual.
3. **Tidak ada jejak approval** (siapa yang menyetujui permintaan apa).
4. **Petugas gudang** tidak punya daftar tugas terstruktur.

## 2. Tujuan Produk

Membuat **Web Service** (REST API) + **Web App** yang:
- Menggantikan alur Google Form + Excel.
- Punya **autentikasi JWT** (3 role: STAFF, ADMIN, PETUGAS).
- **Stok otomatis berkurang** saat petugas menyelesaikan pengantaran.
- **Katalog bergambar** agar staff tidak salah pilih barang.
- **Auditable**: ada `log_stok` (jejak semua perubahan stok).
- Siap dipakai **multi-platform** (Web Next.js + mobile React Native nanti).

## 3. Target Pengguna (User Persona)

| Role | Jumlah | Tugas Utama | Perangkat |
|------|--------|-------------|-----------|
| **STAFF** | ~20–50 orang | Melihat katalog, membuat permintaan ATK | Laptop / HP (web responsive) |
| **ADMIN** | 2–3 orang | Verifikasi akun, CRUD barang, approve permintaan, restock, lihat laporan | Laptop |
| **PETUGAS** | 2 orang | Ambil tugas pengantaran, konfirmasi selesai | HP (web responsive; mobile app fase 2) |

## 4. Ruang Lingkup (Scope)

### 4.1 Termasuk MVP (Fase 1)
| # | Modul | Role yang Akses |
|---|-------|-----------------|
| F-01 | Registrasi + Login (JWT) | Semua |
| F-02 | Verifikasi akun oleh Admin | Admin |
| F-03 | Lupa password + reset via email | Semua |
| F-04 | CRUD Barang + upload gambar | Admin (CRUD) · Semua (baca) |
| F-05 | Buat Permintaan ATK (multi-item) | Staff, Admin, Petugas |
| F-06 | Approve / Tolak Permintaan | Admin |
| F-07 | Lock permintaan (multi-admin, max 10 menit) | Admin |
| F-08 | Tugas Petugas (ambil, lepas, selesai) | Petugas |
| F-09 | Auto kurangi stok saat tugas selesai | Sistem |
| F-10 | Restock (stok masuk) + pencatatan admin | Admin |
| F-11 | Log Stok (audit trail) | Admin |
| F-12 | Laporan periodik | Admin |
| F-13 | Dashboard ringkasan | Admin |
| F-14 | Profil user + ubah profil | Semua |
| F-15 | Kelola user (verify, update role/status) | Admin |

### 4.2 TIDAK Termasuk MVP (masuk Fase 2)
- Aplikasi **mobile native** (APK) untuk petugas — sementara web responsive.
- Notifikasi **WhatsApp / Email push** (kecuali email reset password).
- Laporan **export Excel / PDF** otomatis.
- Multi-gudang (lebih dari satu lokasi).
- Barcode / QR code barang.

## 5. Functional Requirements (Detail Perilaku)

### FR-1: Autentikasi
- **FR-1.1** User mendaftar → `status_akun = BELUM_VERIFIKASI`.
- **FR-1.2** Admin memverifikasi → `status_akun = AKTIF`. Sebelum aktif, login boleh, tapi aksi dibatasi.
- **FR-1.3** Login sukses → API balas JWT `access_token` (expire di `JWT_EXPIRES_IN`).
- **FR-1.4** Setiap request ke endpoint privat wajib header `Authorization: Bearer <token>`.
- **FR-1.5** Rate-limit: 10 login/15 menit/IP, 5 forgot-password/jam/IP.

### FR-2: Permintaan
- **FR-2.1** Satu permintaan berisi **≥1 item** (`barangId` + `jumlah`).
- **FR-2.2** Status awal: `MENUNGGU_ADMIN`.
- **FR-2.3** Admin bisa **lock** permintaan maksimal 10 menit (mencegah 2 admin approve barang sama).
- **FR-2.4** Admin **approve** → status `DISETUJUI_ADMIN`, isi `approved_by` + `approved_at`. Tugas petugas otomatis dibuat (`status_tugas = MENUNGGU_ASSIGN`).
- **FR-2.5** Admin **tolak** → status `DITOLAK_ADMIN` + `catatan_admin`. Stok **tidak** berkurang.
- **FR-2.6** Staff bisa **batal** permintaan miliknya selama masih `MENUNGGU_ADMIN`.

### FR-3: Tugas Petugas
- **FR-3.1** Petugas melihat daftar tugas dengan status `MENUNGGU_ASSIGN`.
- **FR-3.2** Petugas **ambil** tugas → `petugas_id` terisi, `status_tugas = ON_DELIVERY`.
- **FR-3.3** Petugas **lepas** tugas (selama `ON_DELIVERY`) → kembali `MENUNGGU_ASSIGN`.
- **FR-3.4** Petugas **selesaikan** tugas → `status_tugas = DELIVERED`, isi `lokasi_tujuan`. **Sistem otomatis**:
  - Kurangi `barang.stok` sesuai total `jumlah` di `permintaan_item`.
  - Insert `log_stok` (`jenis = APPROVE`, `perubahan = -n`, `referensi_id = permintaan.id`).
  - Update `permintaan.status_admin = SELESAI`.

### FR-4: Barang & Stok
- **FR-4.1** CRUD barang hanya oleh Admin.
- **FR-4.2** Field wajib: `nama`, `satuan`. Opsional: `kode`, `deskripsi`, `stok_minimum`, `gambar_url`.
- **FR-4.3** Upload gambar → Supabase Storage; fallback folder lokal `backend/uploads`.
- **FR-4.4** Restock (stok masuk) oleh Admin → tambah `stok`, catat `stok_masuk`, insert `log_stok` (`jenis = RESTOCK`).

## 6. Non-Functional Requirements

| Kode | Aspek | Target |
|------|-------|--------|
| NFR-1 | **Response time** | < 500 ms untuk 95% request read |
| NFR-2 | **Availability** | 99% (Railway/Vercel/Supabase free tier) |
| NFR-3 | **Security** | JWT, password di-hash bcrypt (≥10 rounds), rate-limit login |
| NFR-4 | **Browser support** | Chrome/Edge/Firefox/Safari versi terbaru |
| NFR-5 | **Responsive** | Desktop, tablet, HP |
| NFR-6 | **Dokumentasi API** | Tersedia (dokumen `05-API-SPEC.md`) |
| NFR-7 | **Akses** | Dari mana saja via internet (bukan hanya LAN kantor) |

## 7. Asumsi & Batasan

**Asumsi:**
- Semua user punya email pribadi untuk registrasi & reset password.
- Ada ≥1 admin "super" yang dibuat via seed database.
- Jumlah transaksi per hari < 500 (bukan e-commerce skala besar).

**Batasan:**
- Free tier cloud (Railway/Supabase) = cold start 5–15 detik di request pertama.
- Penyimpanan gambar Supabase Storage free = 1 GB.
- Belum ada fitur *notification push* (hanya polling refresh).

## 8. Kriteria Keberhasilan

Proyek dianggap sukses KKP bila:
1. Semua 15 fitur di bagian 4.1 **jalan** di demo.
2. Minimal 3 user berbeda role bisa login dan melakukan tugasnya.
3. Satu siklus lengkap berjalan: Staff request → Admin approve → Petugas selesai → Stok berkurang → Log tercatat.
4. Sistem bisa diakses dari **laptop dan HP** (cek responsive).
5. API bisa dipanggil dari **2 platform berbeda** (web Next.js + Postman/mobile simulator) → memenuhi syarat *Web Service*.
6. Laporan KKP memuat: latar belakang, PRD, ERD, arsitektur, use case, API spec, screenshot implementasi.

## 9. Timeline Ringkas

| Minggu | Aktivitas |
|--------|-----------|
| 1 | Requirement + PRD + ERD + rancangan arsitektur |
| 2 | Setup backend (Express + Prisma + PostgreSQL) |
| 3 | Auth module (register, login, verifikasi) |
| 4 | Modul Barang + Upload |
| 5 | Modul Permintaan + Tugas Petugas + logika stok |
| 6 | Restock + Log Stok + Laporan + Dashboard |
| 7 | Frontend Next.js: auth + katalog + permintaan |
| 8 | Frontend: dashboard admin + petugas |
| 9 | Deploy (Railway + Vercel + Supabase) + testing |
| 10 | Finalisasi laporan + presentasi |

---

**Catatan untuk dosen penguji:**
> PRD ini adalah *sumber kebenaran* scope. Jika ada fitur di aplikasi yang tidak tercantum di sini, berarti **di luar scope KKP** (bonus feature).
