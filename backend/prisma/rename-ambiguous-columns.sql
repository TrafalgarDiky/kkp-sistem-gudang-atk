-- Rename kolom yang namanya sama antar tabel supaya lebih jelas di Supabase.
-- Jalankan di Supabase SQL Editor setelah deploy schema Prisma yang sudah memakai @map.
-- Script ini dibuat aman: rename hanya dilakukan kalau kolom lama ada dan kolom baru belum ada.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'nama'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'nama_user'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN nama TO nama_user;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'barang' AND column_name = 'nama'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'barang' AND column_name = 'nama_barang'
  ) THEN
    ALTER TABLE public.barang RENAME COLUMN nama TO nama_barang;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'barang' AND column_name = 'kode'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'barang' AND column_name = 'kode_barang'
  ) THEN
    ALTER TABLE public.barang RENAME COLUMN kode TO kode_barang;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'permintaan' AND column_name = 'kode'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'permintaan' AND column_name = 'kode_permintaan'
  ) THEN
    ALTER TABLE public.permintaan RENAME COLUMN kode TO kode_permintaan;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'permintaan_item' AND column_name = 'jumlah'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'permintaan_item' AND column_name = 'jumlah_diminta'
  ) THEN
    ALTER TABLE public.permintaan_item RENAME COLUMN jumlah TO jumlah_diminta;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stok_masuk' AND column_name = 'jumlah'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stok_masuk' AND column_name = 'jumlah_masuk'
  ) THEN
    ALTER TABLE public.stok_masuk RENAME COLUMN jumlah TO jumlah_masuk;
  END IF;
END $$;

COMMENT ON COLUMN public.users.nama_user IS 'Nama pengguna/user.';
COMMENT ON COLUMN public.barang.nama_barang IS 'Nama barang ATK.';
COMMENT ON COLUMN public.barang.kode_barang IS 'Kode unik barang, contoh A-0001.';
COMMENT ON COLUMN public.permintaan.kode_permintaan IS 'Kode unik permintaan, contoh P-0001.';
COMMENT ON COLUMN public.permintaan_item.jumlah_diminta IS 'Jumlah barang yang diminta.';
COMMENT ON COLUMN public.stok_masuk.jumlah_masuk IS 'Jumlah barang yang masuk/restock.';
