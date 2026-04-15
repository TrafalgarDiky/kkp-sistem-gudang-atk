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

## Rekomendasi: **Opsi B** (URL tetap + view per role)

Untuk kasus kamu — **layout (sidebar) sama semua role, hanya isi halaman (UI) yang beda per role** — yang paling cocok dan paling mudah kamu edit sendiri adalah **Opsi B**.

---

## ✅ Opsi B sudah diterapkan

Struktur ini sudah dipakai di project.

