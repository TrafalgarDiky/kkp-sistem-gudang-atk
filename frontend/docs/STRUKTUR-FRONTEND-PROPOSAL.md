# Contoh Struktur Frontend (Usulan)

Dokumen ini berisi **contoh struktur folder** frontend yang rapi dan **dikelompokkan berdasarkan role** (Admin, Staff, Petugas).  
Setelah kamu setuju, struktur ini bisa diimplementasikan.

---

## Struktur saat ini (sebelum rapih)

```
frontend/
├── app/
│   ├── layout.js              # Root layout (font, globals)
│   ├── page.js                 # Landing /
│   ├── globals.css
│   ├── app-layout.css          # Style sidebar, tabel, modal
│   ├── login/
│   │   ├── page.js
│   │   └── auth.css
│   └── (app)/                  # Semua halaman setelah login (satu folder)
│       ├── layout.js           # AuthGuard + Sidebar + Header
│       ├── dashboard/page.js
│       ├── barang/page.js      # Admin: tabel CRUD | Staff/Petugas: card
│       ├── permintaan/page.js
│       └── permintaan/tugas/page.js
├── components/
│   ├── AuthGuard.js
│   ├── Header.js
│   └── Sidebar.js
├── lib/
│   └── api.js
├── next.config.js
├── jsconfig.json
├── package.json
└── ENV_SETUP.md
```

**Kekurangan:** Semua halaman (dashboard, barang, permintaan, tugas) ada dalam satu kelompok `(app)`; tidak terlihat mana file untuk role mana.

---

## Usulan struktur (dikelompokkan per role)

Ada **2 opsi**: bedanya di **URL** dan cara mengelompokkan file.

---

### Opsi A — URL per role: `/admin/...`, `/staff/...`, `/petugas/...`

**Konsep:** Setiap role punya “prefix” URL sendiri. File halaman dikelompokkan per role.

**Contoh URL:**
- Admin: `/admin/dashboard`, `/admin/barang`, `/admin/permintaan`, `/admin/permintaan/tugas`
- Staff: `/staff/dashboard`, `/staff/barang`, `/staff/permintaan`
- Petugas: `/petugas/dashboard`, `/petugas/barang`, `/petugas/permintaan/tugas`

**Struktur folder usulan:**

```
frontend/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── globals.css
│   ├── login/
│   │   ├── page.js
│   │   └── auth.css
│   │
│   ├── (auth)/                     # Route group: butuh login
│   │   ├── layout.js               # AuthGuard + Sidebar + Header (satu layout)
│   │   │
│   │   ├── admin/                  # Halaman khusus ADMIN
│   │   │   ├── dashboard/page.js
│   │   │   ├── barang/page.js      # Tabel + CRUD + upload
│   │   │   ├── permintaan/page.js
│   │   │   └── permintaan/tugas/page.js
│   │   │
│   │   ├── staff/                  # Halaman khusus STAFF
│   │   │   ├── dashboard/page.js
│   │   │   ├── barang/page.js      # Card (toko online)
│   │   │   └── permintaan/page.js
│   │   │
│   │   └── petugas/                # Halaman khusus PETUGAS
│   │       ├── dashboard/page.js
│   │       ├── barang/page.js      # Card
│   │       └── permintaan/tugas/page.js
│   │
│   └── styles/                     # CSS global layout (opsional: pindah app-layout.css ke sini)
│       └── app-layout.css
│
├── components/
│   ├── layout/
│   │   ├── AuthGuard.js
│   │   ├── Header.js
│   │   └── Sidebar.js
│   ├── barang/                     # Komponen dipakai halaman barang (opsional)
│   │   ├── BarangTable.js          # Tabel (Admin)
│   │   └── BarangCards.js          # Card (Staff/Petugas)
│   └── shared/                     # Komponen dipakai banyak halaman (opsional)
│       └── ...
│
├── lib/
│   └── api.js
├── next.config.js
├── jsconfig.json
├── package.json
└── ENV_SETUP.md
```

**Cara kerja:**
- Setelah login, redirect ke `/admin/dashboard`, `/staff/dashboard`, atau `/petugas/dashboard` sesuai role.
- Sidebar mengarah ke `/admin/barang`, `/staff/barang`, dll. sesuai role.
- Satu layout `(auth)/layout.js` dipakai semua role; isi halaman beda per folder (admin / staff / petugas).

**Kelebihan:** Jelas mana file untuk Admin, Staff, Petugas.  
**Kekurangan:** URL berubah (ada prefix role), dan ada duplikasi file (mis. `dashboard/page.js` di admin, staff, petugas).

---

### Opsi B — URL tetap: `/dashboard`, `/barang`, `/permintaan`, `/permintaan/tugas`

**Konsep:** URL tetap seperti sekarang. Pengelompokan per role dilakukan di **komponen/view**, bukan di route.

**Struktur folder usulan:**

```
frontend/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── globals.css
│   ├── login/
│   │   ├── page.js
│   │   └── auth.css
│   │
│   ├── (app)/
│   │   ├── layout.js               # AuthGuard + Sidebar + Header
│   │   ├── app-layout.css
│   │   ├── dashboard/
│   │   │   └── page.js             # Import view sesuai role
│   │   ├── barang/
│   │   │   └── page.js             # Import view sesuai role
│   │   ├── permintaan/
│   │   │   ├── page.js
│   │   │   └── tugas/
│   │   │       └── page.js
│   │   └── _views/                 # Bukan route (underscore): konten per role
│   │       ├── dashboard/
│   │       │   ├── AdminDashboard.js
│   │       │   ├── StaffDashboard.js
│   │       │   └── PetugasDashboard.js
│   │       ├── barang/
│   │       │   ├── AdminBarang.js   # Tabel + CRUD
│   │       │   └── StaffBarang.js   # Card (dipakai juga Petugas)
│   │       ├── permintaan/
│   │       │   ├── AdminPermintaan.js
│   │       │   └── StaffPermintaan.js
│   │       └── tugas/
│   │           └── PetugasTugas.js
│   │
│   └── ...
│
├── components/
│   ├── layout/
│   │   ├── AuthGuard.js
│   │   ├── Header.js
│   │   └── Sidebar.js
│   └── ui/                         # Komponen UI umum (tombol, modal, tabel)
│       └── ...
│
├── lib/
│   └── api.js
├── next.config.js
├── jsconfig.json
├── package.json
└── ENV_SETUP.md
```

**Cara kerja:**
- `app/(app)/barang/page.js` baca role dari `localStorage` → render `<AdminBarang />` atau `<StaffBarang />`.
- File halaman (page.js) tetap sedikit; yang beda per role ada di `_views/...` (Admin..., Staff..., Petugas...).

**Kelebihan:** URL tidak berubah, tidak ada duplikasi route.  
**Kekurangan:** Pengelompokan per role ada di folder `_views`, bukan di nama route.

---

## Perbandingan singkat

| Aspek              | Opsi A (URL per role)     | Opsi B (URL tetap, view per role) |
|--------------------|---------------------------|-----------------------------------|
| URL                | `/admin/barang`, `/staff/barang` | `/barang` (sama semua role) |
| File per role      | Satu folder per role (admin/, staff/, petugas/) | Satu folder _views/ berisi Admin..., Staff..., Petugas... |
| Duplikasi route    | Ada (dashboard, barang di 3 role) | Hampir tidak |
| Kejelasan “file untuk role X” | Sangat jelas dari path folder | Jelas dari nama file di _views |

---

## Rekomendasi: **Opsi B** (URL tetap + view per role)

Untuk kasus kamu — **layout (sidebar) sama semua role, hanya isi halaman (UI) yang beda per role** — yang paling cocok dan paling mudah kamu edit sendiri adalah **Opsi B**.

### Kenapa Opsi B lebih baik untuk kamu

| Alasan | Penjelasan singkat |
|--------|---------------------|
| **Layout cuma satu** | Sidebar & header sama untuk Admin, Staff, Petugas. Kamu cuma rawat satu layout (`(app)/layout.js`), tidak perlu tiga layout terpisah. |
| **Mudah diedit** | Mau ubah tampilan barang untuk **Staff**? Buka satu file: `_views/barang/StaffBarang.js`. Mau ubah untuk **Admin**? Buka `_views/barang/AdminBarang.js`. Satu fitur = satu file per role, jelas. |
| **URL tetap** | Tetap `/dashboard`, `/barang`, `/permintaan`, `/permintaan/tugas`. Tidak perlu hafal `/admin/barang` vs `/staff/barang`. Redirect setelah login tetap ke `/dashboard`. |
| **Sedikit duplikasi** | Satu route untuk tiap fitur (satu `page.js` untuk barang, satu untuk dashboard, dll.). Isi yang beda per role ada di folder `_views`, bukan duplikat banyak `page.js`. |
| **Nambah role/halaman gampang** | Nanti mau tambah role atau tambah halaman: tambah file view (mis. `PetugasBarang.js`) dan satu kondisi di `page.js`, tanpa bikin folder route baru. |

### Kalau pakai Opsi A

- Layout tetap bisa satu, tapi kamu punya **banyak route** (admin/dashboard, staff/dashboard, petugas/dashboard, admin/barang, staff/barang, …).
- Setiap ubah struktur navigasi atau layout, kamu bisa bingung “apa harus ubah di tiga tempat?” — padahal layout-nya sama. Dengan Opsi B, layout cuma satu tempat.

### Kesimpulan

- **Pakai Opsi B**: satu layout, URL tetap, isi halaman dikelompokkan per role di folder **`_views`** (Admin..., Staff..., Petugas...).
- Lebih mudah kamu edit sendiri: ubah UI untuk satu role = ubah satu file view; ubah sidebar = ubah satu layout.

---

## ✅ Opsi B sudah diterapkan

Struktur di bawah ini **sudah dipakai** di project.

```
frontend/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── globals.css
│   ├── login/
│   │   ├── page.js
│   │   └── auth.css
│   └── (app)/
│       ├── layout.js              # import dari @/components/layout
│       ├── app-layout.css
│       ├── dashboard/
│       │   └── page.js             # render AdminDashboard | StaffDashboard | PetugasDashboard
│       ├── barang/
│       │   └── page.js             # render AdminBarang | StaffBarang
│       ├── permintaan/
│       │   ├── page.js             # render AdminPermintaan | StaffPermintaan
│       │   └── tugas/
│       │       └── page.js         # render AdminTugas | PetugasTugas
│       └── _views/                 # konten per role (bukan route)
│           ├── dashboard/
│           │   ├── AdminDashboard.js
│           │   ├── StaffDashboard.js
│           │   └── PetugasDashboard.js
│           ├── barang/
│           │   ├── AdminBarang.js   # tabel + CRUD + upload
│           │   └── StaffBarang.js   # card (Staff & Petugas)
│           ├── permintaan/
│           │   ├── AdminPermintaan.js
│           │   └── StaffPermintaan.js
│           └── tugas/
│               ├── AdminTugas.js
│               └── PetugasTugas.js
├── components/
│   └── layout/
│       ├── index.js                # export AuthGuard, Header, Sidebar
│       ├── AuthGuard.js
│       ├── Header.js
│       └── Sidebar.js
├── lib/
│   └── api.js
├── docs/
│   └── STRUKTUR-FRONTEND-PROPOSAL.md
├── next.config.js
├── jsconfig.json
├── package.json
└── ENV_SETUP.md
```

**Cara edit per role:**  
Ubah tampilan barang untuk Staff → edit `app/(app)/_views/barang/StaffBarang.js`.  
Ubah tampilan barang untuk Admin → edit `app/(app)/_views/barang/AdminBarang.js`.
