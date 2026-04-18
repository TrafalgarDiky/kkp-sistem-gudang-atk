"use client";

/**
 * BarangCombobox — custom dropdown untuk pilih barang.
 *
 * Keunggulan vs <select> native:
 * - Search di dalam dropdown (filter realtime nama/kode)
 * - Tampilkan stok per item dengan badge warna (normal/low/empty)
 * - Tutup otomatis saat klik di luar
 *
 * Props:
 * - items       : array barang [{id, nama, kode, satuan, stok, stokMinimum}]
 * - value       : id barang yang sedang dipilih (string | "")
 * - onChange    : (id) => void
 * - placeholder : string (default: "— Pilih barang —")
 * - allowEmpty  : kalau true, tampilkan opsi "Semua" di paling atas (untuk filter)
 * - emptyLabel  : label opsi "Semua" (default: "Semua barang")
 */
import { useEffect, useMemo, useRef, useState } from "react";

function getStokBadgeClass(stok, stokMin) {
  const s = Number(stok) || 0;
  const min = Number(stokMin) || 0;
  if (s <= 0) return "is-empty";
  if (min > 0 && s <= min) return "is-low";
  return "";
}

export default function BarangCombobox({
  items = [],
  value,
  onChange,
  placeholder = "— Pilih barang —",
  allowEmpty = false,
  emptyLabel = "Semua barang",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
    else setQuery("");
  }, [open]);

  const selected = items.find((b) => b.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (b) =>
        (b.nama || "").toLowerCase().includes(q) ||
        (b.kode || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const handlePick = (id) => {
    onChange(id);
    setOpen(false);
  };

  const triggerLabel = selected
    ? `${selected.nama} (${selected.satuan})`
    : value === "" && allowEmpty
    ? emptyLabel
    : placeholder;

  const isPlaceholder = !selected && !(value === "" && allowEmpty);

  return (
    <div className={`combobox${open ? " is-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="combobox-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`combobox-trigger-text${isPlaceholder ? " is-placeholder" : ""}`}>
          {triggerLabel}
        </span>
        <i className="fa-solid fa-chevron-down combobox-trigger-icon" />
      </button>

      {open && (
        <div className="combobox-dropdown" role="listbox">
          <div className="combobox-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Cari nama atau kode barang..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="combobox-list">
            {allowEmpty && (
              <div
                role="option"
                aria-selected={!value}
                className={`combobox-item${!value ? " is-active" : ""}`}
                onClick={() => handlePick("")}
              >
                <span className="combobox-item-name app-muted">{emptyLabel}</span>
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="combobox-empty">Tidak ada barang cocok.</div>
            ) : (
              filtered.map((b) => {
                const badgeClass = getStokBadgeClass(b.stok, b.stokMinimum);
                return (
                  <div
                    key={b.id}
                    role="option"
                    aria-selected={b.id === value}
                    className={`combobox-item${b.id === value ? " is-active" : ""}`}
                    onClick={() => handlePick(b.id)}
                  >
                    <span className="combobox-item-name">
                      {b.nama} <small>({b.satuan})</small>
                    </span>
                    <span className={`combobox-item-stok ${badgeClass}`}>
                      Stok: {b.stok}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
