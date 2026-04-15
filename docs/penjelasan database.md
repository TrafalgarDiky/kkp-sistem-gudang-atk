## Penjelasan Database (PostgreSQL / Supabase)

Dokumen ini menjelaskan **tabel**, **kolom**, dan **relasi** database untuk sistem Gudang ATK.

### Apa tujuan bagian ini?
- Biar kamu paham **data disimpan di tabel mana**, dan **kenapa ada kolom-kolom tertentu**.
- Biar kamu mudah jelasin di laporan KKP (BAB database/arsitektur).

### Apa input?
- Struktur database yang ada di `backend/prisma/schema.prisma` (Prisma ORM).

### Apa output?
- Penjelasan tabel inti: `users`, `barang`, `permintaan`, `permintaan_item`, `tugas_petugas`, `stok_masuk`, `log_stok`.
- Diagram relasi sederhana + contoh alur data.

### Kenapa pakai cara ini?
- Sistem gudang butuh **jejak transaksi** (permintaan, pengantaran, pemasukan) dan **audit stok**.

---

## Gambaran Besar Relasi (ringkas)

```
users (STAFF/ADMIN/PETUGAS)
  1 ───< permintaan (peminta_id) >───< permintaan_item >─── 1 barang
                 |
                 └───< tugas_petugas (permintaan_id) >─── users (petugas_id)

barang
  1 ───< stok_masuk (barang_id) >─── users (admin_id)

barang
  1 ───< log_stok (barang_id) >─── users (admin_id, opsional)
                 |
                 └── referensi_id: id permintaan atau id stok_masuk (untuk jejak sumber perubahan)
```

Istilah baru (singkat):
- **PK (Primary Key)**: kolom unik penanda baris, biasanya `id`.
- **FK (Foreign Key)**: kolom yang menunjuk `id` tabel lain (relasi).
- **One-to-many**: satu data bisa punya banyak anak (misal 1 user staff punya banyak permintaan).
- **Many-to-many**: banyak ke banyak, biasanya pakai tabel perantara (misal permintaan ↔ barang lewat `permintaan_item`).

---

## 1) Tabel `users` (semua akun)

**Fungsi**: menyimpan data login dan identitas semua role: `ADMIN`, `STAFF`, `PETUGAS`.

Kolom penting:
- **`id` (PK)**: UUID user.
- **`nama`**: nama user.
- **`email`**: unik, dipakai login.
- **`divisi`**: opsional (misal “Keuangan”, “Umum”).
- **`password_hash`** (di Prisma namanya `passwordHash`): password yang sudah di-hash.
- **`role`**: `STAFF` / `ADMIN` / `PETUGAS`.
- **`status_akun`** (di Prisma `statusAkun`): `BELUM_VERIFIKASI` / `AKTIF` / `DITOLAK`.
- **`created_at`, `updated_at`**: waktu buat & update.

Relasi dari `users`:
- 1 user (STAFF) **punya banyak** `permintaan` lewat `permintaan.peminta_id`.
- 1 user (ADMIN) bisa jadi `approved_by` di `permintaan`.
- 1 user (PETUGAS) **punya banyak** `tugas_petugas`.
- 1 user (ADMIN) **punya banyak** `stok_masuk` (yang mencatat pemasukan).

---

## 2) Tabel `barang` (katalog ATK)

**Fungsi**: menyimpan master barang + stok.

Kolom penting:
- **`id` (PK)**: UUID barang.
- **`kode`**: kode unik (misal `A-0001`) (opsional).
- **`nama`**: nama barang.
- **`deskripsi`**: opsional.
- **`satuan`**: misal “buah”, “rim”, “pack”.
- **`stok`**: stok saat ini (angka).
- **`stok_minimum`** (di Prisma `stokMinimum`): batas minimum (opsional).
- **`gambar_url`** (di Prisma `gambarUrl`): link gambar (opsional).
- **`created_at`, `updated_at`**: waktu buat & update.

Relasi dari `barang`:
- 1 barang bisa muncul di banyak `permintaan_item`.
- 1 barang bisa punya banyak `stok_masuk`.
- 1 barang bisa punya banyak `log_stok`.

---

## 3) Tabel `permintaan` (header permintaan)

**Fungsi**: satu “dokumen/nota” permintaan dari satu staff (bisa berisi banyak item).

Kolom penting:
- **`id` (PK)**: UUID permintaan.
- **`nomor`**: nomor urut (opsional). Saat ini sistem masih sering menampilkan potongan `id` sebagai “kode singkat”.
- **`peminta_id` (FK → users.id)**: siapa yang minta (staff/admin jika admin juga boleh request).
- **`status_admin`**: status permintaan (`MENUNGGU_ADMIN`, `DISETUJUI_ADMIN`, `DITOLAK_ADMIN`, `SELESAI`).
- **`approved_by` (FK → users.id, opsional)**: admin yang menyetujui/menolak (kalau auto-approve, bisa kosong).
- **`approved_at`**: waktu approve/tolak.
- **`catatan_admin`**: catatan (alasan ditolak / info lain).
- **`assigned_admin_id` (FK → users.id, opsional)**: admin yang “mengunci/memegang” permintaan (konsep lock multi-admin).
- **`locked_at`**: waktu lock (biasanya untuk batas 10 menit).
- **`created_at`, `updated_at`**: waktu buat & update.

Relasi dari `permintaan`:
- 1 permintaan **punya banyak** `permintaan_item` (daftar barang + jumlah).
- 1 permintaan **punya banyak** `tugas_petugas` (tugas pengantaran untuk petugas).

---

## 4) Tabel `permintaan_item` (detail item permintaan)

**Fungsi utama**: menjawab pertanyaan kamu “`permintaan_item` ini untuk apa?”

Kenapa perlu tabel ini?
- Karena **1 permintaan bisa berisi banyak barang**.
- Karena **1 barang bisa muncul di banyak permintaan**.
- Maka relasi `permintaan` ↔ `barang` adalah **many-to-many**, dan tabel perantaranya adalah `permintaan_item`.

Kolom penting:
- **`id` (PK)**: UUID item.
- **`permintaan_id` (FK → permintaan.id)**: item ini milik permintaan mana.
- **`barang_id` (FK → barang.id)**: item ini barang apa.
- **`jumlah`**: jumlah yang diminta.
- **`created_at`**: waktu dibuat.

Contoh:
- Permintaan P1 meminta:
  - kertas 2 rim
  - pulpen 5 buah
Maka ada 2 baris di `permintaan_item` untuk `permintaan_id = P1`.

---

## 5) Tabel `tugas_petugas` (tugas pengantaran)

**Fungsi**: menyimpan “pekerjaan” petugas terkait permintaan.

Kolom penting:
- **`id` (PK)**: UUID tugas.
- **`permintaan_id` (FK → permintaan.id)**: tugas ini untuk permintaan mana.
- **`petugas_id` (FK → users.id, opsional)**: petugas yang mengambil tugas (bisa kosong kalau belum diambil).
- **`assigned_by_admin_id` (FK → users.id, opsional)**: admin yang assign (kalau ada fitur assign manual).
- **`lokasi_tujuan`**: lokasi pengantaran (diisi saat konfirmasi selesai).
- **`status_tugas`**: status di sisi petugas (`MENUNGGU_ASSIGN`, `ON_DELIVERY`, `DELIVERED`, dll).
- **`dibuat_otomatis`**: true kalau tugas dibuat otomatis saat permintaan dibuat.
- **`created_at`, `updated_at`**: waktu buat & update.

Relasi:
- Banyak `tugas_petugas` mengarah ke 1 `permintaan`.
- Banyak `tugas_petugas` bisa dipegang oleh 1 `users` (petugas).

---

## 6) Tabel `stok_masuk` (pemasukan / restock)

**Fungsi**: mencatat stok masuk (barang ditambah).

Kolom penting:
- **`id` (PK)**: UUID restock.
- **`barang_id` (FK → barang.id)**: barang yang masuk.
- **`jumlah`**: jumlah masuk.
- **`sumber`**: dari mana (supplier / pembelian / donasi) (opsional).
- **`tanggal`**: tanggal stok masuk.
- **`admin_id` (FK → users.id)**: admin pencatat.
- **`created_at`**: waktu pencatatan.

---

## 7) Tabel `log_stok` (audit perubahan stok)

**Fungsi**: jejak perubahan stok (+/-) untuk audit.

Kolom penting:
- **`id` (PK)**: UUID log.
- **`barang_id` (FK → barang.id)**: barang yang berubah stoknya.
- **`perubahan`**: angka positif/negatif (misal `+10` restock, `-2` pengeluaran).
- **`jenis`**: `RESTOCK`, `APPROVE`, `PENYESUAIAN`.
- **`referensi_id`**: id yang jadi sumber perubahan:
  - bisa menunjuk `stok_masuk.id` (kalau jenis `RESTOCK`)
  - bisa menunjuk `permintaan.id` (kalau stok berkurang karena permintaan selesai)
- **`keterangan`**: catatan tambahan (opsional).
- **`admin_id` (FK → users.id, opsional)**: admin yang melakukan (bisa null kalau perubahan otomatis oleh sistem).
- **`created_at`**: waktu log dibuat.

---

## Alur Data (contoh end-to-end)

### A) Staff membuat permintaan
1. Insert ke `permintaan` (header).
2. Insert beberapa baris ke `permintaan_item` (detail barang + jumlah).
3. Insert ke `tugas_petugas` (tugas menunggu diambil).

### B) Petugas mengantar lalu selesai
1. Update `tugas_petugas.status_tugas` jadi `SELESAI/DELIVERED` + isi `lokasi_tujuan`.
2. Sistem mengurangi `barang.stok` sesuai jumlah item.
3. Insert `log_stok` perubahan negatif (`jenis = APPROVE`, `referensi_id = permintaan.id`).
4. Update `permintaan.status_admin` jadi `SELESAI`.

### C) Admin mencatat pemasukan (restock)
1. Insert ke `stok_masuk`.
2. Update `barang.stok` increment.
3. Insert `log_stok` perubahan positif (`jenis = RESTOCK`, `referensi_id = stok_masuk.id`).

