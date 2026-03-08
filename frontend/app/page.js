/**
 * Halaman utama (/) — langsung ke login.
 * Buka website = langsung tampil halaman login.
 */
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
}
