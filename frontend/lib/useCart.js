"use client";

/**
 * useCart — custom hook untuk mengelola keranjang permintaan barang.
 *
 * Tujuan:
 *   Menyimpan daftar barang yang mau diajukan oleh staff sebelum submit.
 *   Keranjang disimpan di localStorage supaya tidak hilang saat reload.
 *
 * Cara pakai:
 *   const { items, addItem, removeItem, updateQty, clear, count } = useCart();
 *
 * Sinkronisasi antar komponen:
 *   Setiap perubahan cart dispatch CustomEvent "gatk:cart-change".
 *   Semua komponen yang pakai useCart mendengar event ini dan re-read
 *   dari localStorage, sehingga state di semua komponen selalu sinkron.
 *
 * Bentuk 1 item di keranjang:
 *   {
 *     barangId: string,
 *     nama: string,
 *     satuan: string,
 *     gambarUrl: string | null,
 *     stok: number,   // disimpan saat add → dipakai untuk cap qty
 *     jumlah: number, // qty yang diminta user
 *   }
 */
import { useCallback, useEffect, useState } from "react";

// Key localStorage — versi "v1" agar kalau struktur berubah kita gampang migrasi.
const CART_KEY = "gatk:cart:v1";
// Nama event custom untuk notify semua komponen yang pakai useCart.
const CART_EVENT = "gatk:cart-change";

// ============ Helper internal (bukan hook) ============

/**
 * Baca keranjang dari localStorage.
 * Defensive: kalau JSON rusak / tidak ada window → return [].
 */
function readCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Tulis keranjang ke localStorage + broadcast perubahan ke semua listener.
 */
function writeCart(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  } catch {
    // Storage quota habis / disabled: diam saja supaya UI tidak crash.
  }
}

// ============ Hook utama ============

export function useCart() {
  // State awal []: penting untuk hindari hydration mismatch di Next.js
  // (server render tidak punya localStorage).
  const [items, setItems] = useState([]);
  // Flag "sudah load dari storage" — berguna untuk hide/show UI keranjang.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Saat komponen mount di browser, baru baca localStorage.
    setItems(readCart());
    setReady(true);

    // Listener untuk sinkronisasi:
    // 1. "gatk:cart-change" — perubahan dari tab yang sama.
    // 2. "storage"          — perubahan dari tab browser lain.
    const sync = () => setItems(readCart());
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // ============ Derived values (tidak perlu state terpisah) ============

  // Jumlah jenis barang (misal 3 jenis, meski total pcs lebih banyak).
  const count = items.length;
  // Total pcs semua barang dijumlahkan (buat ditampilkan di footer cart).
  const totalQty = items.reduce((sum, it) => sum + (it.jumlah || 0), 0);

  // ============ Query helper ============

  const isInCart = useCallback(
    (barangId) => items.some((it) => it.barangId === barangId),
    [items]
  );

  const getItem = useCallback(
    (barangId) => items.find((it) => it.barangId === barangId),
    [items]
  );

  // ============ Mutasi ============

  /**
   * Tambah barang ke keranjang (atau tambah qty kalau sudah ada).
   * Qty otomatis di-cap maksimal sesuai stok yang tersedia.
   *
   * @param {object} barang - { id, nama, satuan, gambarUrl, stok }
   * @param {number} jumlah - default 1
   */
  const addItem = useCallback((barang, jumlah = 1) => {
    const current = readCart();
    const idx = current.findIndex((it) => it.barangId === barang.id);
    const maxStok = Number(barang.stok) || 0;
    let next;

    if (idx >= 0) {
      // Sudah ada → tambah qty (cap ke stok, update stok snapshot)
      const newQty = Math.min(current[idx].jumlah + jumlah, maxStok);
      next = [...current];
      next[idx] = {
        ...next[idx],
        jumlah: newQty,
        stok: maxStok, // refresh stok agar sesuai data terbaru
      };
    } else {
      // Belum ada → push baru
      next = [
        ...current,
        {
          barangId: barang.id,
          nama: barang.nama,
          satuan: barang.satuan,
          gambarUrl: barang.gambarUrl || null,
          stok: maxStok,
          jumlah: Math.min(jumlah, maxStok),
        },
      ];
    }
    writeCart(next);
  }, []);

  /**
   * Hapus 1 barang dari keranjang.
   */
  const removeItem = useCallback((barangId) => {
    const next = readCart().filter((it) => it.barangId !== barangId);
    writeCart(next);
  }, []);

  /**
   * Set qty spesifik. Kalau jumlah <= 0, otomatis dihapus.
   * Cap ke stok.
   */
  const updateQty = useCallback((barangId, jumlah) => {
    const num = Number(jumlah) || 0;
    if (num <= 0) {
      const next = readCart().filter((it) => it.barangId !== barangId);
      writeCart(next);
      return;
    }
    const current = readCart();
    const idx = current.findIndex((it) => it.barangId === barangId);
    if (idx < 0) return;
    const next = [...current];
    const maxStok = current[idx].stok || num;
    next[idx] = { ...next[idx], jumlah: Math.min(num, maxStok) };
    writeCart(next);
  }, []);

  /**
   * Kosongkan keranjang (dipakai setelah submit sukses).
   */
  const clear = useCallback(() => {
    writeCart([]);
  }, []);

  return {
    items,
    ready,
    count,
    totalQty,
    isInCart,
    getItem,
    addItem,
    removeItem,
    updateQty,
    clear,
  };
}
