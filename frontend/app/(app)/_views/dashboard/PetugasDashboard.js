"use client";

/** Dashboard — tampilan untuk role PETUGAS */
export default function PetugasDashboard({ user }) {
  return (
    <main className="app-content">
      <h1>Dashboard Petugas</h1>
      {user && (
        <p>
          Halo, <strong>{user.nama}</strong>. Anda login sebagai <strong>Petugas</strong>.
        </p>
      )}
      <p style={{ marginTop: "1rem", color: "#63626b" }}>
        Lihat barang dan daftar tugas pengambilan/pengantaran dari menu sidebar.
      </p>
    </main>
  );
}
