# Setup Environment Frontend

Buat file **`.env.local`** di folder `frontend/` dengan isi:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- **NEXT_PUBLIC_API_URL** = alamat backend API. Lokal: `http://localhost:3001`.
- **Buka dari HP / PC lain di LAN:** ganti ke IP komputer server, mis. `http://192.168.1.50:3001` (backend & folder `uploads` harus jalan di mesin itu).
- Gambar katalog memakai URL ini + path `/uploads/...` dari database — jangan simpan `localhost` di DB (backend punya skrip `npm run normalize:gambar-url`).
- Prefix `NEXT_PUBLIC_` wajib agar variabel bisa dipakai di kode browser (client-side).
- Jangan commit `.env.local` ke git (sudah di .gitignore).
