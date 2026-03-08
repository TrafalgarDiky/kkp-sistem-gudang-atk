# Setup Environment Frontend

Buat file **`.env.local`** di folder `frontend/` dengan isi:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- **NEXT_PUBLIC_API_URL** = alamat backend API. Saat development backend jalan di port 3001.
- Prefix `NEXT_PUBLIC_` wajib agar variabel bisa dipakai di kode browser (client-side).
- Jangan commit `.env.local` ke git (sudah di .gitignore).
