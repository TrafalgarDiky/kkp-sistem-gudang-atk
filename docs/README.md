# 📚 Dokumentasi Sistem Gudang ATK (KKP)

> Pintu masuk semua dokumen. Baca sesuai kebutuhan kamu.

---

## 🗺️ Peta Dokumen

| No | File | Isi | Saat Dibutuhkan |
|----|------|-----|----------------|
| 0 | `README.md` *(ini)* | Index pintu masuk | Pertama kali membuka folder |
| 1 | [`01-PRD.md`](./01-PRD.md) | Product Requirements — apa yang dibangun & kenapa | BAB I & III laporan |
| 2 | [`02-ERD-DAN-KAMUS-DATA.md`](./02-ERD-DAN-KAMUS-DATA.md) | Diagram database + kamus data | BAB III (Perancangan DB) |
| 3 | [`03-ARSITEKTUR-SISTEM.md`](./03-ARSITEKTUR-SISTEM.md) | Arsitektur 3-tier + deployment | BAB III (Arsitektur) |
| 4 | [`04-USE-CASE-DAN-ALUR.md`](./04-USE-CASE-DAN-ALUR.md) | Use case + flowchart + state diagram | BAB III (Analisis & Perancangan) |
| 5 | [`05-API-SPEC.md`](./05-API-SPEC.md) | Semua endpoint REST | Lampiran + BAB IV |
| 6 | [`06-CHECKLIST-KKP.md`](./06-CHECKLIST-KKP.md) | Peta dokumen → BAB, screenshot, testing | Saat menulis laporan |
| 7 | [`LAPORAN-KKP-TEMPLATE.md`](./LAPORAN-KKP-TEMPLATE.md) | Template laporan BAB I–V siap copy ke Word | Saat membuat laporan resmi |

### Dokumen Lama (Rujukan Tambahan)
| File | Isi |
|------|-----|
| `PERENCANAAN-SISTEM-GUDANG-ATK.md` | Pertanyaan requirement awal |
| `penjelasan database.md` | Penjelasan naratif tabel-tabel |
| `STRUKTUR-FRONTEND-PROPOSAL.md` | Struktur folder Next.js |
| `STRUKTUR-DAN-EDIT.md` | Catatan struktur project |
| `CATATAN_TUTORIAL.md` | Catatan belajar |
| `tutorialgithub.md` | Tutorial Git/GitHub |

---

## 🎯 Rekomendasi Urutan Baca

### Untuk **Dosen Pembimbing / Penguji**
1. `01-PRD.md` — paham scope & tujuan
2. `02-ERD-...md` — cek model data
3. `03-ARSITEKTUR-...md` — cek teknologi
4. `05-API-SPEC.md` — cek kelengkapan endpoint

### Untuk **Kamu (Mahasiswa, saat menulis laporan)**
1. `LAPORAN-KKP-TEMPLATE.md` — isi `<TODO>`, copy ke Word
2. `06-CHECKLIST-KKP.md` — checklist screenshot & testing
3. Dokumen 1–5 dijadikan **sumber copy** ke BAB yang sesuai

### Untuk **Programmer yang Melanjutkan Project**
1. `03-ARSITEKTUR-...md` — paham struktur folder
2. `02-ERD-...md` — paham database
3. `05-API-SPEC.md` — paham endpoint yang tersedia
4. Baca kode: `backend/src/server.js` → `backend/prisma/schema.prisma`

---

## 🛠️ Cara Melihat Diagram Mermaid

File `02`, `03`, `04` berisi diagram Mermaid (teks). Cara melihatnya:

- **Cursor / VS Code**: Buka file `.md`, tekan `Ctrl+Shift+V` untuk preview.
- **GitHub / GitLab**: Otomatis ter-render saat di-push.
- **Export ke gambar**:
  1. Buka preview.
  2. Zoom sesuai ukuran yang diinginkan.
  3. Screenshot (Windows: `Win+Shift+S`).
  4. Paste ke Word.

---

## ✅ Status Dokumen

| Dokumen | Status | Update Terakhir |
|---------|--------|-----------------|
| 01-PRD | ✅ Selesai | April 2026 |
| 02-ERD | ✅ Selesai | April 2026 |
| 03-Arsitektur | ✅ Selesai | April 2026 |
| 04-Use Case | ✅ Selesai | April 2026 |
| 05-API Spec | ✅ Selesai (match 100% dengan kode) | April 2026 |
| 06-Checklist | ✅ Selesai | April 2026 |
| Laporan Template | ✅ Selesai | April 2026 |

---

## 📝 Yang Perlu Kamu Isi (`<TODO>`)

Cari text `<TODO:` di semua dokumen — itu placeholder yang harus kamu isi dengan data pribadi (nama, NIM, kampus, dosen, dll).

Cari di Cursor:
- Tekan `Ctrl+Shift+F`
- Ketik: `<TODO:`
- Ganti satu per satu.

---

**Selamat mengerjakan KKP! 🎓**
