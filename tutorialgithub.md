# Panduan Git & GitHub untuk Project KKP

Catatan singkat cara push project ke GitHub dan cara kerja saat ada perubahan.

---

## 1. Persiapan (sekali saja)

### 1.1 Pastikan Git terpasang

Di terminal/PowerShell:

```bash
git --version
```

Jika belum terpasang, unduh dari: https://git-scm.com/downloads

### 1.2 Buat repo di GitHub

1. Login ke https://github.com
2. Klik **New repository** (tombol hijau)
3. Isi **Repository name** (misal: `KKP` atau `gudang-atk`)
4. Pilih **Public**
5. **Jangan** centang "Add a README" (karena project sudah ada di komputer)
6. Klik **Create repository**
7. Salin URL repo (misal: `https://github.com/username/KKP.git`)

### 1.3 Inisialisasi Git di folder project (jika belum)

Buka terminal di folder project (contoh: `d:\KKP`):

```bash
cd d:\KKP
git init
```

Artinya: folder ini jadi satu “proyek Git”.

### 1.4 Tambahkan remote GitHub

Ganti `URL_REPO_KAMU` dengan URL repo yang kamu salin:

```bash
git remote add origin https://github.com/NAMA_USER/NAMA_REPO.git
```

Contoh:

```bash
git remote add origin https://github.com/johndoe/KKP.git
```

Cek apakah sudah benar:

```bash
git remote -v
```

Harus muncul `origin` dengan URL repo kamu.

---

## 2. Push pertama kali ke GitHub

### 2.1 Buat file .gitignore (penting)

Agar file yang tidak perlu (node_modules, .env, build) tidak ikut ke GitHub.

Di folder `d:\KKP` buat file bernama **`.gitignore`** (titik di depan) dengan isi contoh:

```
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Environment (JANGAN push .env — berisi rahasia)
.env
.env.local
.env.*.local
backend/.env
frontend/.env.local

# Build / cache
frontend/.next/
frontend/out/
*.log
.DS_Store

# Prisma
backend/node_modules/
```

Simpan.

### 2.2 Tambahkan semua file, commit, lalu push

```bash
cd d:\KKP

# Lihat file yang akan di-commit
git status

# Tambahkan semua file (kecuali yang di .gitignore)
git add .

# Commit dengan pesan
git commit -m "Initial commit: project Gudang ATK (Next.js + Node + PostgreSQL)"

# Push ke branch main (nama branch default GitHub)
git push -u origin main
```

Jika GitHub memakai branch **master**:

```bash
git push -u origin master
```

Jika diminta username/password: pakai **Personal Access Token** (bukan password login). Cara buat: GitHub → Settings → Developer settings → Personal access tokens.

Setelah berhasil, buka repo di browser; semua kode sudah ada di GitHub.

---

## 3. Jika ada perubahan — cara update ke GitHub

Setiap kali kamu mengubah kode (backend/frontend/schema/dll.), ikuti urutan ini.

### Langkah 1: Cek status

```bash
cd d:\KKP
git status
```

Ini menampilkan file yang **berubah** atau **baru**.

### Langkah 2: Tambahkan file yang mau di-push

Tambahkan semua perubahan:

```bash
git add .
```

Atau hanya file tertentu:

```bash
git add backend/prisma/schema.prisma
git add frontend/app/restock/page.js
```

### Langkah 3: Commit (simpan “snapshot” di lokal)

```bash
git commit -m "Deskripsi singkat perubahan"
```

Contoh pesan:

- `"Tambah halaman Restock dan Log Stok"`
- `"Perbaikan validasi login"`
- `"Update schema Prisma: stokMinimum"`

### Langkah 4: Push ke GitHub

```bash
git push
```

Kalau pertama kali push branch ini:

```bash
git push -u origin main
```

Setelah itu cukup `git push`.

---

## 4. Ringkasan alur saat ada perubahan

| Urutan | Perintah        | Kegunaan                          |
|--------|-----------------|-----------------------------------|
| 1      | `git status`    | Lihat file yang berubah           |
| 2      | `git add .`     | Siapkan semua perubahan           |
| 3      | `git commit -m "pesan"` | Simpan snapshot di komputer |
| 4      | `git push`      | Kirim ke GitHub                   |

Ulangi 1–4 setiap kali selesai mengerjakan fitur/perbaikan.

---

## 5. Hal yang perlu diingat

- **Jangan push file `.env`** — berisi password DB dan rahasia. Pastikan `.env` ada di `.gitignore`.
- **Commit sering, pesan jelas** — misal: "Tambah API restock", "Fix error di halaman Users".
- **Sebelum push**, pastikan project masih jalan (backend/frontend tidak error).

---

## 6. Jika repo sudah ada dan kamu clone di komputer lain

```bash
git clone https://github.com/NAMA_USER/NAMA_REPO.git
cd NAMA_REPO
```

Lalu install dependency:

- Backend: `cd backend && npm install`
- Frontend: `cd frontend && npm install`

Dan isi `.env` sesuai environment (DB, PORT, dll.). Setelah itu kamu bisa lanjut pakai `git pull` (ambil perubahan terbaru) dan `git push` (kirim perubahan).

---

*File: `tutorialgithub.md` — panduan push & update project ke GitHub.*
