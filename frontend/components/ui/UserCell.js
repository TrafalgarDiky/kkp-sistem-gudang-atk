/**
 * UserCell — komponen kecil untuk menampilkan user dalam tabel/list.
 *
 * Render: avatar bulat berisi inisial + nama.
 * Warna avatar otomatis dari hash nama (konsisten per user).
 *
 * Props:
 * - name      : string nama user
 * - fallback  : string yang ditampilkan kalau name kosong (default: "—")
 *
 * Helpers diekspor terpisah supaya bisa dipakai di tempat lain (misal pill warna):
 * - getInitials(name)     -> "AG" dari "Admin Gudang"
 * - getAvatarColor(name)  -> "#22c55e" (deterministik dari nama)
 */

const PALETTE = ["#6366f1", "#0ea5e9", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6"];

export function getInitials(name) {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}

export function getAvatarColor(name) {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function UserCell({ name, fallback = "—" }) {
  if (!name) return <span className="app-muted">{fallback}</span>;
  return (
    <span className="user-cell">
      <span
        className="avatar"
        style={{ "--avatar-bg": getAvatarColor(name) }}
      >
        {getInitials(name)}
      </span>
      <span className="user-cell-name">{name}</span>
    </span>
  );
}
