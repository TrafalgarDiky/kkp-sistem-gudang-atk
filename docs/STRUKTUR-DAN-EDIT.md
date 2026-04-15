# Struktur Frontend & Di Mana Mengubah Tampilan/Logic

## 1. Ada 3 folder yang namanya ada "dashboard" — bedanya apa?

| Folder | Untuk apa? | Perlu dirawat? |
|--------|------------|----------------|
| **`app/dashboard/`** | **Sisa lama.** Dulu dashboard ada di sini, lalu dipindah ke `(app)`. Kalau folder ini **kosong**, tidak dipakai Next.js. | **Tidak.** Kalau kosong, **boleh dihapus** (hapus manual folder `app/dashboard`). |
| **`app/(app)/dashboard/`** | **Route** — bikin URL **`/dashboard`**. Isinya cuma **`page.js`**: baca role user → pilih view mana yang ditampilkan. Bukan tempat tampilan asli. | Hampir tidak diubah. Ubah hanya kalau ganti cara memilih view (misal tambah role). |
| **`app/(app)/_views/dashboard/`** | **Konten per role** — isi tampilan dan logic: `AdminDashboard.js`, `StaffDashboard.js`, `PetugasDashboard.js`. Ini yang tampil di layar. | **Ya.** Ubah tampilan atau logic dashboard di sini. |

**Singkatnya:**
- **`app/dashboard/`** (langsung di bawah app) = sisa lama, kosong → boleh dihapus.
- **`app/(app)/dashboard/`** = alamat halaman (URL `/dashboard`), isi cuma pengatur pilih view.
- **`app/(app)/_views/dashboard/`** = isi halaman per role → **ini yang diedit** untuk ubah tampilan/logic dashboard.

---

## 2. Halaman utama website

Saat user membuka **`/`** (root), mereka **langsung diarahkan ke halaman login** (`/login`).
Redirect ini dilakukan di **`app/page.js`**.

---

## 3. Mengubah halaman Admin (tampilan atau logic)

Semua tampilan dan logic khusus **Admin** ada di folder **`_views`**, per fitur:

| Mau ubah apa (Admin) | Edit file ini |
|----------------------|----------------|
| **Dashboard Admin** (tampilan / teks / logic) | `app/(app)/_views/dashboard/AdminDashboard.js` |
| **Barang Admin** (tabel, CRUD, upload, logic) | `app/(app)/_views/barang/AdminBarang.js` |
| **Permintaan Admin** (list, approve, logic) | `app/(app)/_views/permintaan/AdminPermintaan.js` |
| **Tugas Admin** (list tugas, logic) | `app/(app)/_views/tugas/AdminTugas.js` |

**Jangan ubah untuk tampilan/logic Admin:**
- `app/(app)/dashboard/page.js` → hanya pengatur yang memilih AdminDashboard / StaffDashboard / PetugasDashboard.
- File lain di `_views` yang bukan Admin (mis. `StaffBarang.js`) → untuk role lain.

---

## 4. Ringkas: mau ubah apa, buka file mana

- **Halaman utama = login** → logic redirect di **`app/page.js`**.
- **Dashboard Admin** (tampilan/logic) → **`app/(app)/_views/dashboard/AdminDashboard.js`**.
- **Barang Admin** (tampilan/logic) → **`app/(app)/_views/barang/AdminBarang.js`**.
- **Permintaan Admin** → **`app/(app)/_views/permintaan/AdminPermintaan.js`**.
- **Tugas Admin** → **`app/(app)/_views/tugas/AdminTugas.js`**.
- **Sidebar / navigasi** (sama untuk semua role) → **`components/layout/Sidebar.js`**.

