# Use Case & Alur Sistem — Gudang ATK

> **Use Case** = daftar "apa yang bisa dilakukan user di sistem". **Alur (Flowchart)** = gambaran langkah yang terjadi saat fitur dijalankan.

**Mahasiswa:** `<TODO: Nama>` · **NIM:** `<TODO>` · **Dosen Pembimbing:** `<TODO>` · **Instansi KKP:** `<TODO>`

---

## 1. Use Case Diagram

```mermaid
flowchart LR
  staff((Staff))
  admin((Admin))
  petugas((Petugas))
  system((Sistem))

  subgraph UC["Sistem Gudang ATK"]
    UC1[Register / Login]
    UC2[Lupa / Reset Password]
    UC3[Lihat Katalog Barang]
    UC4[Buat Permintaan ATK]
    UC5[Lihat Daftar Permintaan Sendiri]
    UC6[Batal Permintaan Sendiri]
    UC7[Verifikasi Akun User]
    UC8[CRUD Barang + Upload Gambar]
    UC9[Lock Permintaan]
    UC10[Approve / Tolak Permintaan]
    UC11[Restock / Stok Masuk]
    UC12[Lihat Log Stok]
    UC13[Lihat Laporan Periodik]
    UC14[Lihat Dashboard]
    UC15[Lihat Tugas]
    UC16[Ambil / Lepas Tugas]
    UC17[Selesaikan Tugas / Antar Barang]
    UC18[Auto Kurangi Stok + Tulis Log]
  end

  staff --- UC1
  staff --- UC2
  staff --- UC3
  staff --- UC4
  staff --- UC5
  staff --- UC6

  admin --- UC1
  admin --- UC2
  admin --- UC3
  admin --- UC7
  admin --- UC8
  admin --- UC9
  admin --- UC10
  admin --- UC11
  admin --- UC12
  admin --- UC13
  admin --- UC14

  petugas --- UC1
  petugas --- UC2
  petugas --- UC3
  petugas --- UC15
  petugas --- UC16
  petugas --- UC17

  system --- UC18
```

---

## 2. Use Case Detail (Format Tabel)

### UC-04: Buat Permintaan ATK (Staff)

| Atribut | Isi |
|---------|-----|
| **Aktor Utama** | Staff |
| **Pra-kondisi** | User login + `status_akun = AKTIF` |
| **Pasca-kondisi** | Baris baru di `permintaan` + ≥1 di `permintaan_item`, status `MENUNGGU_ADMIN` |
| **Main Flow** | 1. Staff buka halaman "Buat Permintaan"<br/>2. Pilih barang + isi jumlah (ulang untuk multi-item)<br/>3. Klik "Kirim"<br/>4. Sistem validasi `items[]` tidak kosong & jumlah ≥ 1<br/>5. Sistem simpan ke DB dan balikan sukses |
| **Alternative Flow** | 4a. Item kosong → 400 *"Minimal satu item barang"*<br/>4b. `barangId` tidak valid → 400 |
| **Endpoint** | `POST /api/permintaan` |

### UC-10: Approve / Tolak Permintaan (Admin)

| Atribut | Isi |
|---------|-----|
| **Aktor Utama** | Admin |
| **Pra-kondisi** | Permintaan `MENUNGGU_ADMIN` + (opsional) sudah di-lock admin ini |
| **Pasca-kondisi** | `status_admin` ter-update; jika approve → `tugas_petugas` dibuat otomatis |
| **Main Flow** | 1. Admin buka daftar permintaan<br/>2. Admin klik "Lock" (opsional, max 10 menit)<br/>3. Admin klik **Approve** atau **Tolak** + isi catatan bila tolak<br/>4. Sistem update `status_admin`, isi `approved_by`, `approved_at`<br/>5. Jika approve → insert `tugas_petugas` dengan `status = MENUNGGU_ASSIGN`<br/>6. Response sukses |
| **Alternative Flow** | 3a. Permintaan sudah di-lock admin lain < 10 menit → 409 *"Sedang diproses admin lain"* |
| **Endpoint** | `PATCH /api/permintaan/:id/approve` |

### UC-17: Selesaikan Tugas (Petugas)

| Atribut | Isi |
|---------|-----|
| **Aktor Utama** | Petugas |
| **Pra-kondisi** | Tugas `ON_DELIVERY` dan `petugas_id = user ini` |
| **Pasca-kondisi** | `status_tugas = DELIVERED`, `barang.stok` berkurang, `log_stok` tercatat, `permintaan.status_admin = SELESAI` |
| **Main Flow** | 1. Petugas buka tugas yang sedang dipegang<br/>2. Isi `lokasi_tujuan`<br/>3. Klik "Selesai"<br/>4. Sistem bungkus dalam transaction:<br/>  a. Update status tugas<br/>  b. Kurangi stok tiap item (loop)<br/>  c. Insert log_stok tiap item (`jenis=APPROVE`)<br/>  d. Update `permintaan.status_admin = SELESAI`<br/>5. Response sukses |
| **Alternative Flow** | 4b. Stok kurang dari jumlah permintaan → rollback, 400 *"Stok tidak cukup"* |
| **Endpoint** | `PATCH /api/permintaan/tugas/:id` |

### UC-11: Restock (Admin)

| Atribut | Isi |
|---------|-----|
| **Aktor Utama** | Admin |
| **Pasca-kondisi** | `stok_masuk` +1 baris, `barang.stok` bertambah, `log_stok` +1 baris (`jenis=RESTOCK`) |
| **Endpoint** | `POST /api/restock` |

*(Use case lain mengikuti pola yang sama. Untuk laporan, 3 use case detail di atas sudah mewakili "alur utama" sistem.)*

---

## 3. Flowchart Alur Utama (End-to-End)

```mermaid
flowchart TD
  Start([Staff login]) --> A[Buka katalog]
  A --> B[Pilih barang + jumlah]
  B --> C[Kirim permintaan]
  C --> D{Validasi<br/>items ok?}
  D -- "tidak" --> E[400 error]
  D -- "ya" --> F[Insert permintaan<br/>status=MENUNGGU_ADMIN]
  F --> G([Admin login])
  G --> H{Lock permintaan?}
  H -- "opsional" --> I[Set assigned_admin_id<br/>+ locked_at]
  H --> J{Approve atau Tolak?}
  J -- "Tolak" --> K[status=DITOLAK_ADMIN<br/>+ catatan_admin]
  K --> Z([Selesai])
  J -- "Approve" --> L[status=DISETUJUI_ADMIN<br/>insert tugas_petugas]
  L --> M([Petugas login])
  M --> N[Lihat daftar tugas]
  N --> O[Klik Ambil Tugas]
  O --> P[status_tugas=ON_DELIVERY<br/>petugas_id terisi]
  P --> Q[Antar ke staff]
  Q --> R[Isi lokasi_tujuan<br/>klik Selesai]
  R --> S[(Transaction)]
  S --> T[Update status_tugas=DELIVERED]
  S --> U[Kurangi barang.stok per item]
  S --> V[Insert log_stok per item]
  S --> W[Update permintaan<br/>status_admin=SELESAI]
  W --> Z
```

---

## 4. Flowchart Alur Auth (Register → Verifikasi)

```mermaid
flowchart TD
  A[User isi form register] --> B[POST /api/auth/register]
  B --> C[Simpan user<br/>status_akun=BELUM_VERIFIKASI]
  C --> D([Tunggu admin])
  D --> E[Admin buka halaman Pending Users]
  E --> F[GET /api/auth/pending]
  F --> G[Admin klik Verifikasi]
  G --> H[PATCH /api/auth/users/:id/verify]
  H --> I[status_akun=AKTIF]
  I --> J([User bisa login penuh])
```

---

## 5. State Diagram — Permintaan

```mermaid
stateDiagram-v2
  [*] --> MENUNGGU_ADMIN : Staff submit
  MENUNGGU_ADMIN --> DITOLAK_ADMIN : Admin Tolak
  MENUNGGU_ADMIN --> DISETUJUI_ADMIN : Admin Approve
  DISETUJUI_ADMIN --> SELESAI : Petugas DELIVERED
  DITOLAK_ADMIN --> [*]
  SELESAI --> [*]
  MENUNGGU_ADMIN --> [*] : Staff Batal
```

---

## 6. State Diagram — Tugas Petugas

```mermaid
stateDiagram-v2
  [*] --> MENUNGGU_ASSIGN : dibuat saat Admin Approve
  MENUNGGU_ASSIGN --> ON_DELIVERY : Petugas Ambil
  ON_DELIVERY --> MENUNGGU_ASSIGN : Petugas Lepas
  ON_DELIVERY --> DELIVERED : Selesai + stok berkurang
  MENUNGGU_ASSIGN --> DITOLAK : Admin tolak permintaan
  DELIVERED --> [*]
  DITOLAK --> [*]
```

---

## 7. Ringkasan Matriks Akses (Role × Use Case)

| Use Case | STAFF | ADMIN | PETUGAS |
|----------|:-----:|:-----:|:-------:|
| Register / Login | ✓ | ✓ | ✓ |
| Lihat Katalog | ✓ | ✓ | ✓ |
| Buat Permintaan | ✓ | ✓ | ✓ |
| Batal Permintaan Sendiri | ✓ | — | — |
| CRUD Barang | — | ✓ | — |
| Verifikasi User | — | ✓ | — |
| Approve / Tolak | — | ✓ | — |
| Lock Permintaan | — | ✓ | — |
| Restock | — | ✓ | — |
| Log Stok | — | ✓ | — |
| Laporan | — | ✓ | — |
| Dashboard | — | ✓ | — |
| Kelola User | — | ✓ | — |
| Lihat Tugas | — | ✓ (read) | ✓ |
| Ambil / Lepas Tugas | — | — | ✓ |
| Selesaikan Tugas | — | — | ✓ |
