"use client";

/**
 * Header / Topbar — logo + nama user + logout.
 * Layout sama untuk semua role.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header({ user }) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/login");
  };

  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        <Link href="/dashboard" className="app-logo">
          <span className="app-logo-mark" aria-hidden="true">
            <i className="fa-solid fa-box-open" />
          </span>
          <span className="app-logo-brand">GATK</span>
        </Link>
      </div>

      <div className="app-topbar-right">
        <div className="app-user">
          <span className="app-user-name">{user?.nama || "User"}</span>
          <span className="app-user-role-badge">{user?.role || ""}</span>
        </div>

        <button type="button" className="app-logout" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket" />
          Logout
        </button>
      </div>
    </header>
  );
}
