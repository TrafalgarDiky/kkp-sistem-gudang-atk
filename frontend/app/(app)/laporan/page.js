"use client";

/**
 * Laporan — Admin: agregat KPI + ranking per periode.
 * Bukan tabel detail (untuk detail: buka Barang Masuk / Log Stok / Permintaan).
 *
 * Fitur:
 * - Toolbar: judul + preset periode (7/30/90 hari, bulan ini, bulan lalu, semua) + custom range + export
 * - 4 stat cards: Qty masuk, Qty keluar, Jumlah restock, Permintaan selesai
 * - 2-col ranking: Top barang masuk + Top barang keluar
 * - Top pengguna paling aktif
 *
 * Endpoint: GET /api/laporan?dari=&sampai=
 */
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/api";
import { UserCell } from "@/components/ui";

// ====================== Periode presets ======================

/**
 * Hitung rentang tanggal preset.
 * Return: { dari, sampai } dalam format "YYYY-MM-DD" atau "" untuk semua waktu.
 */
function calcPreset(key) {
  const today = new Date();
  const yyyy_mm_dd = (d) => d.toISOString().slice(0, 10);

  switch (key) {
    case "7d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { dari: yyyy_mm_dd(d), sampai: yyyy_mm_dd(today) };
    }
    case "30d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { dari: yyyy_mm_dd(d), sampai: yyyy_mm_dd(today) };
    }
    case "90d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 89);
      return { dari: yyyy_mm_dd(d), sampai: yyyy_mm_dd(today) };
    }
    case "thisMonth": {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dari: yyyy_mm_dd(d), sampai: yyyy_mm_dd(today) };
    }
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { dari: yyyy_mm_dd(start), sampai: yyyy_mm_dd(end) };
    }
    case "all":
    default:
      return { dari: "", sampai: "" };
  }
}

const PRESETS = [
  { key: "7d", label: "7 hari" },
  { key: "30d", label: "30 hari" },
  { key: "90d", label: "90 hari" },
  { key: "thisMonth", label: "Bulan ini" },
  { key: "lastMonth", label: "Bulan lalu" },
  { key: "all", label: "Semua" },
];

// ====================== Helpers ======================

function downloadCsv(filename, rows) {
  const escape = (s) => {
    const str = (s ?? "").toString();
    if (/[",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
    return str;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fmtDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

// ====================== Sub-Components ======================

/**
 * Ranking list reusable.
 * - title: judul card
 * - icon: classname FA
 * - sub: subtitle kecil di bawah judul
 * - items: array { name, satuan, value, valueSub? }
 * - emptyText: ditampilkan kalau items kosong
 */
function RankingCard({ title, icon, sub, items, emptyText = "Belum ada data." }) {
  return (
    <div className="ranking-card">
      <div className="ranking-card-header">
        <span className="ranking-card-icon"><i className={icon} /></span>
        <h3>{title}</h3>
      </div>
      {sub && <p className="ranking-card-sub">{sub}</p>}
      {items.length === 0 ? (
        <p className="app-muted" style={{ fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>{emptyText}</p>
      ) : (
        <div className="ranking-list">
          {items.map((it, idx) => (
            <div key={idx} className={`ranking-item${idx === 0 ? " is-top1" : idx === 1 ? " is-top2" : idx === 2 ? " is-top3" : ""}`}>
              <span className="ranking-rank">{idx + 1}</span>
              <span className="ranking-name">
                {it.name} {it.satuan && <small>({it.satuan})</small>}
              </span>
              <span className="ranking-value">
                {it.value}
                {it.valueSub && <span className="ranking-value-sub">{it.valueSub}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================== Page ======================

export default function LaporanPage() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter periode (default: 30 hari)
  const [activePreset, setActivePreset] = useState("30d");
  const [filter, setFilter] = useState(calcPreset("30d"));

  // ====================== Effects ======================

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) { try { setUser(JSON.parse(raw)); } catch (_) {} }
  }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filter.dari) params.set("dari", filter.dari);
      if (filter.sampai) params.set("sampai", filter.sampai);
      const q = params.toString();
      const res = await fetch(apiUrl("/api/laporan" + (q ? "?" + q : "")), { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || "Gagal memuat laporan");
    } catch (err) {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    fetchLaporan();
  }, [user?.role, filter.dari, filter.sampai]);

  // ====================== Handlers ======================

  const handlePreset = (key) => {
    setActivePreset(key);
    setFilter(calcPreset(key));
  };

  const handleDateChange = (field, value) => {
    setActivePreset("custom");
    setFilter((f) => ({ ...f, [field]: value }));
  };

  const handleExport = () => {
    if (!data) return;
    const rows = [["Bagian", "Nama", "Satuan/Divisi", "Nilai"]];
    rows.push(["KPI", "Total qty masuk", "", String(data.total?.qtyMasuk ?? 0)]);
    rows.push(["KPI", "Total qty keluar", "", String(data.total?.qtyKeluar ?? 0)]);
    rows.push(["KPI", "Jumlah restock", "", String(data.total?.restock ?? 0)]);
    rows.push(["KPI", "Permintaan selesai", "", String(data.total?.permintaan ?? 0)]);
    rows.push([]);
    rows.push(["TOP BARANG MASUK", "Nama", "Satuan", "Total qty"]);
    for (const r of data.topPemasukan ?? []) {
      rows.push(["", r.namaBarang, r.satuan, String(r.totalQty)]);
    }
    rows.push([]);
    rows.push(["TOP BARANG KELUAR", "Nama", "Satuan", "Total qty"]);
    for (const r of data.topPengeluaran ?? []) {
      rows.push(["", r.namaBarang, r.satuan, String(r.totalQty)]);
    }
    rows.push([]);
    rows.push(["TOP PENGGUNA", "Nama", "Divisi", "Permintaan / Qty"]);
    for (const u of data.topPengguna ?? []) {
      rows.push(["", u.nama, u.divisi ?? "-", `${u.totalPermintaan} / ${u.totalQty}`]);
    }
    downloadCsv(`laporan_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  // ====================== Derived ======================

  const total = data?.total ?? { qtyMasuk: 0, qtyKeluar: 0, restock: 0, permintaan: 0 };
  const topPemasukan = data?.topPemasukan ?? [];
  const topPengeluaran = data?.topPengeluaran ?? [];
  const topPengguna = data?.topPengguna ?? [];

  const periodeLabel = useMemo(() => {
    if (!filter.dari && !filter.sampai) return "Semua waktu";
    return `${fmtDate(filter.dari)} s/d ${fmtDate(filter.sampai)}`;
  }, [filter.dari, filter.sampai]);

  // ====================== Guards ======================

  if (user?.role !== "ADMIN") {
    return (
      <main className="app-content">
        <h1>Laporan</h1>
        <p>Anda tidak memiliki akses ke halaman ini.</p>
      </main>
    );
  }

  // ====================== Render ======================

  return (
    <main className="app-content">
      {/* ============ TOOLBAR ============ */}
      <div className="list-toolbar">
        <h1>Laporan</h1>
        <div className="list-toolbar-spacer" />

        <div className="preset-group" role="tablist" aria-label="Periode preset">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={activePreset === p.key}
              className={`preset-btn${activePreset === p.key ? " is-active" : ""}`}
              onClick={() => handlePreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="filter-row" title="Custom periode">
          <i className="fa-regular fa-calendar" />
          <input
            type="date"
            value={filter.dari}
            onChange={(e) => handleDateChange("dari", e.target.value)}
            aria-label="Dari"
          />
          <span>—</span>
          <input
            type="date"
            value={filter.sampai}
            onChange={(e) => handleDateChange("sampai", e.target.value)}
            aria-label="Sampai"
          />
        </div>

        <div className="list-toolbar-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={handleExport}
            disabled={loading || !data}
            title="Export ringkasan ke CSV"
          >
            <i className="fa-solid fa-download" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <p className="app-muted" style={{ marginTop: "-0.5rem", marginBottom: "1rem", fontSize: "0.88rem" }}>
        Ringkasan agregat untuk periode <strong>{periodeLabel}</strong>. Untuk detail per transaksi, buka menu Barang Masuk / Log Stok / Permintaan.
      </p>

      {error && <p className="app-error">{error}</p>}

      {loading ? (
        <p className="app-muted">Memuat laporan...</p>
      ) : (
        <>
          {/* ============ KPI STAT CARDS ============ */}
          <div className="stats-grid" style={{ marginBottom: "1rem" }}>
            <div className="stats-card" style={{ "--accent": "#22c55e", "--accent-soft": "#ecfdf5" }}>
              <div className="stats-card-head">
                <span className="stats-icon"><i className="fa-solid fa-arrow-down" /></span>
                <div className="stats-value">{total.qtyMasuk}</div>
              </div>
              <div className="stats-label">Total qty masuk</div>
            </div>
            <div className="stats-card" style={{ "--accent": "#ef4444", "--accent-soft": "#fef2f2" }}>
              <div className="stats-card-head">
                <span className="stats-icon"><i className="fa-solid fa-arrow-up" /></span>
                <div className="stats-value">{total.qtyKeluar}</div>
              </div>
              <div className="stats-label">Total qty keluar</div>
            </div>
            <div className="stats-card" style={{ "--accent": "#0ea5e9", "--accent-soft": "#f0f9ff" }}>
              <div className="stats-card-head">
                <span className="stats-icon"><i className="fa-solid fa-truck-ramp-box" /></span>
                <div className="stats-value">{total.restock}</div>
              </div>
              <div className="stats-label">Jumlah restock</div>
            </div>
            <div className="stats-card" style={{ "--accent": "#3b82f6", "--accent-soft": "#eff6ff" }}>
              <div className="stats-card-head">
                <span className="stats-icon"><i className="fa-solid fa-clipboard-check" /></span>
                <div className="stats-value">{total.permintaan}</div>
              </div>
              <div className="stats-label">Permintaan selesai</div>
            </div>
          </div>

          {/* ============ TOP BARANG (2 kolom) ============ */}
          <div className="report-two-col">
            <RankingCard
              title="Top Barang Masuk"
              icon="fa-solid fa-arrow-trend-up"
              sub="Barang paling banyak di-restock pada periode ini."
              items={topPemasukan.map((r) => ({
                name: r.namaBarang,
                satuan: r.satuan,
                value: `+${r.totalQty}`,
              }))}
              emptyText="Belum ada restock di periode ini."
            />
            <RankingCard
              title="Top Barang Keluar"
              icon="fa-solid fa-arrow-trend-down"
              sub="Barang paling banyak diminta pada periode ini."
              items={topPengeluaran.map((r) => ({
                name: r.namaBarang,
                satuan: r.satuan,
                value: `-${r.totalQty}`,
              }))}
              emptyText="Belum ada permintaan selesai di periode ini."
            />
          </div>

          {/* ============ TOP PENGGUNA ============ */}
          <div className="ranking-card">
            <div className="ranking-card-header">
              <span className="ranking-card-icon"><i className="fa-solid fa-users" /></span>
              <h3>Top Pengguna Paling Aktif</h3>
            </div>
            <p className="ranking-card-sub">Pemohon dengan permintaan terbanyak pada periode ini.</p>
            {topPengguna.length === 0 ? (
              <p className="app-muted" style={{ fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>
                Belum ada permintaan di periode ini.
              </p>
            ) : (
              <div className="ranking-list">
                {topPengguna.map((u, idx) => (
                  <div key={u.userId} className={`ranking-item${idx === 0 ? " is-top1" : idx === 1 ? " is-top2" : idx === 2 ? " is-top3" : ""}`}>
                    <span className="ranking-rank">{idx + 1}</span>
                    <span className="ranking-name" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <UserCell name={u.nama} />
                      {u.divisi && <small style={{ color: "#94a3b8" }}>· {u.divisi}</small>}
                    </span>
                    <span className="ranking-value">
                      {u.totalPermintaan}x
                      <span className="ranking-value-sub">({u.totalQty} qty)</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
