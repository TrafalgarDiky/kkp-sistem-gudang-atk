# Checklist Laporan KKP — Sistem Gudang ATK

> Peta **dokumen apa dipakai di BAB berapa** + daftar screenshot dan artefak yang perlu disiapkan untuk laporan & presentasi.

**Mahasiswa:** `<TODO: Nama>` · **NIM:** `<TODO>` · **Dosen Pembimbing:** `<TODO>` · **Instansi KKP:** `<TODO>`

---

## 1. Struktur BAB Umum Laporan KKP

| BAB | Judul Umum | Isi Ringkas |
|-----|-----------|-------------|
| **I** | Pendahuluan | Latar belakang, rumusan masalah, tujuan, manfaat, batasan |
| **II** | Tinjauan Pustaka | Teori: Web Service, REST, JWT, Node.js, PostgreSQL, ORM, Next.js |
| **III** | Analisis & Perancangan Sistem | PRD, ERD, arsitektur, use case, flowchart |
| **IV** | Implementasi & Hasil | Screenshot fitur, potongan kode penting, hasil testing |
| **V** | Penutup | Kesimpulan, saran |
| **Lampiran** | - | API spec, source code, manual |

---

## 2. Peta Dokumen → BAB

| Dokumen | BAB yang Memakai | Dipakai untuk |
|---------|------------------|----------------|
| `01-PRD.md` | BAB I + III | Latar belakang (§1), tujuan (§2), scope (§4), fitur (§5) |
| `02-ERD-DAN-KAMUS-DATA.md` | BAB III | Sub-bab "Perancangan Database" — tampilkan diagram ERD + tabel kamus data |
| `03-ARSITEKTUR-SISTEM.md` | BAB III | Sub-bab "Arsitektur Sistem" — diagram 3-tier + diagram deployment |
| `04-USE-CASE-DAN-ALUR.md` | BAB III | Sub-bab "Analisis Kebutuhan" (use case) + "Perancangan Proses" (flowchart, state diagram) |
| `05-API-SPEC.md` | Lampiran + BAB IV | Lampiran daftar endpoint; BAB IV cuplikan saat menjelaskan implementasi |
| `06-CHECKLIST-KKP.md` | Internal | Panduan pribadi |
| `penjelasan database.md` (lama) | Rujukan tambahan | Penjelasan naratif tiap tabel (pelengkap §2) |
| `PERENCANAAN-SISTEM-GUDANG-ATK.md` (lama) | Rujukan tambahan | Asal pertanyaan requirement |
| `STRUKTUR-FRONTEND-PROPOSAL.md` (lama) | BAB IV | Struktur folder Next.js |

---

## 3. Checklist Screenshot untuk BAB IV (Implementasi)

Siapkan screenshot berikut (resolusi minimal 1280 lebar):

### 3.1 Halaman Auth
- [ ] Halaman **Register** (form kosong)
- [ ] Halaman **Login**
- [ ] Halaman **Forgot Password**
- [ ] Email **reset password** (inbox)
- [ ] Halaman **Reset Password**

### 3.2 Admin
- [ ] Dashboard ringkasan
- [ ] Daftar **Pending Users** + tombol verifikasi
- [ ] Form **Tambah Barang** + upload gambar
- [ ] Daftar barang (dengan gambar)
- [ ] Daftar permintaan dengan filter status
- [ ] Proses **Approve** permintaan + lock 10 menit
- [ ] Form **Restock**
- [ ] Halaman **Log Stok**
- [ ] Halaman **Laporan** periodik

### 3.3 Staff
- [ ] Katalog barang (view)
- [ ] Form **Buat Permintaan** (multi-item)
- [ ] Daftar permintaan sendiri + status badge
- [ ] Detail satu permintaan

### 3.4 Petugas
- [ ] Daftar tugas (`MENUNGGU_ASSIGN`, `ON_DELIVERY`)
- [ ] Tombol **Ambil Tugas**
- [ ] Form **Selesaikan** + input `lokasi_tujuan`

### 3.5 Bukti Web Service / Multi-Platform (WAJIB untuk tema KKP)
- [ ] Screenshot response `GET /api/health` via **browser**
- [ ] Screenshot call API via **Thunder Client / Postman / Insomnia** (header, body, response)
- [ ] Screenshot aplikasi **web Next.js** konsumsi API
- [ ] Screenshot API dipanggil dari **platform kedua** (HP browser / Postman / mobile app) — memenuhi syarat *2 platform*
- [ ] Dokumentasi **endpoint list** (ambil dari `05-API-SPEC.md`)

### 3.6 Security
- [ ] Screenshot header **Authorization: Bearer**
- [ ] Contoh response **401 Unauthorized** (tanpa token)
- [ ] Contoh response **403 Forbidden** (role salah)
- [ ] Screenshot password **hashed di DB** (bukan plain)
- [ ] Contoh **rate limit 429** saat spam login

### 3.7 Deployment
- [ ] URL production **Vercel** (buka di browser)
- [ ] URL production **Railway** (`/api/health`)
- [ ] Dashboard **Supabase** (tabel terisi)
- [ ] Dashboard **Supabase Storage** bucket `foto-barang`

---

## 4. Checklist Diagram (Gambar di Laporan)

Semua diagram **Mermaid** bisa di-screenshot langsung dari Cursor / VS Code preview:

- [ ] Gambar 3.1 — **ERD** (dari `02-ERD-DAN-KAMUS-DATA.md` §1)
- [ ] Gambar 3.2 — **Arsitektur 3-tier** (`03-ARSITEKTUR-SISTEM.md` §1)
- [ ] Gambar 3.3 — **Arsitektur deployment** (§4)
- [ ] Gambar 3.4 — **Use case diagram** (`04-USE-CASE-DAN-ALUR.md` §1)
- [ ] Gambar 3.5 — **Flowchart alur utama** (§3)
- [ ] Gambar 3.6 — **State diagram permintaan** (§5)
- [ ] Gambar 3.7 — **State diagram tugas** (§6)
- [ ] Gambar 4.1 — **Sequence diagram** buat permintaan (`03-ARSITEKTUR-SISTEM.md` §6)

---

## 5. Checklist Testing Sebelum Presentasi

### 5.1 Smoke Test End-to-End
1. [ ] Register 3 akun (staff, admin, petugas).
2. [ ] Admin verifikasi 2 akun lainnya.
3. [ ] Admin tambah 3 barang (upload gambar).
4. [ ] Staff buat 1 permintaan berisi 2 item.
5. [ ] Admin approve permintaan.
6. [ ] Petugas ambil tugas.
7. [ ] Petugas selesaikan tugas → cek `barang.stok` berkurang + `log_stok` tercatat.
8. [ ] Admin restock satu barang → cek `stok` bertambah + `log_stok` tercatat.
9. [ ] Admin buka laporan → angka sesuai transaksi.
10. [ ] Staff **tidak bisa** akses endpoint admin (cek 403).

### 5.2 Edge Case
- [ ] Login salah password → 401.
- [ ] Login 11× salah → 429.
- [ ] Buat permintaan tanpa item → 400.
- [ ] Petugas selesaikan tapi stok kurang → 400 + rollback.
- [ ] Dua admin lock permintaan yang sama dalam 10 menit → admin kedua dapat 409.

### 5.3 Responsive
- [ ] Buka di browser HP (atau DevTools mode mobile) — menu tetap kebaca.

---

## 6. Checklist File Serah Terima

Folder yang diserahkan ke dosen pembimbing:

```
KKP-Gudang-ATK/
├── docs/
│   ├── 01-PRD.md
│   ├── 02-ERD-DAN-KAMUS-DATA.md
│   ├── 03-ARSITEKTUR-SISTEM.md
│   ├── 04-USE-CASE-DAN-ALUR.md
│   ├── 05-API-SPEC.md
│   └── 06-CHECKLIST-KKP.md
├── backend/          (source code Express)
├── frontend/         (source code Next.js)
├── mobile-petugas/   (skeleton React Native — opsional)
├── Laporan-KKP.docx  (BAB I–V)
├── Presentasi.pptx
└── README.md         (cara run local)
```

---

## 7. Template Kesimpulan (BAB V) — Boilerplate

> Ringkasan singkat yang bisa kamu adaptasi:

**Kesimpulan:**
1. Sistem Gudang ATK berhasil dibangun sebagai **Web Service REST** (Node.js + Express) dengan client **web Next.js** yang mengkonsumsi API yang sama.
2. Autentikasi **JWT + rate limit** memenuhi kriteria keamanan dasar Web Service.
3. Semua 15 fitur MVP di PRD berhasil diimplementasikan dan diuji *end-to-end*.
4. Database terdiri dari 7 tabel utama dengan relasi yang sudah dinormalisasi hingga 3NF.

**Saran Pengembangan:**
1. Tambah notifikasi **WhatsApp / Email push** untuk permintaan baru.
2. Buat aplikasi **mobile React Native** untuk petugas (fase 2).
3. Export laporan ke **PDF / Excel**.
4. Dukungan **multi-gudang / multi-lokasi**.
5. Integrasi **barcode / QR code** pada barang.

---

## 8. Timeline Siapkan Laporan (Saran H-14 sebelum sidang)

| Hari | Aktivitas |
|------|-----------|
| H-14 | Tulis BAB I (latar belakang dari `01-PRD.md` §1) |
| H-12 | Tulis BAB II (tinjauan pustaka) |
| H-10 | Tulis BAB III (pakai §3 ERD + §4 Use Case + §5 Arsitektur) |
| H-7 | Jalankan smoke test, ambil semua screenshot |
| H-5 | Tulis BAB IV (implementasi + screenshot) |
| H-3 | Tulis BAB V + abstrak + daftar pustaka |
| H-2 | Bikin slide presentasi |
| H-1 | Review akhir + simulasi tanya-jawab |

---

**Semangat sidang KKP! 🎓**
