/**
 * Root layout — dipakai semua halaman.
 * Tujuan: bungkus seluruh app dengan HTML dasar + CSS global + font.
 */
import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-poppins" });

export const metadata = {
  title: "Gudang ATK",
  description: "Sistem Gudang Alat Tulis Kantor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={poppins.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
