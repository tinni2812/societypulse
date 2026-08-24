"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";

type NavbarProps = {
  name?: string | null;
  role?: "RESIDENT" | "ADMIN" | null;
};

export default function Navbar({ name, role }: NavbarProps) {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  const isGuest = !role;
  const isAdmin = role === "ADMIN";

  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const links = isGuest
    ? []
    : isAdmin
      ? [
          { href: "/admin/dashboard", label: "Dashboard" },
          { href: "/admin/notices", label: "Notices" },
        ]
      : [
          { href: "/resident/dashboard", label: "Dashboard" },
          { href: "/resident/complaints", label: "Complaints" },
          { href: "/resident/notices", label: "Notices" },
        ];

  async function handleLogout() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  const brandHref = isAdmin
    ? "/admin/dashboard"
    : role === "RESIDENT"
      ? "/resident/dashboard"
      : "/login";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href={brandHref}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            S
          </div>

          <span className="text-lg font-bold text-gray-900 dark:text-white">
            SocietyPulse
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right-side controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Account - logged-in users only */}
          {!isGuest && (
            <div
              ref={accountRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  {(name?.charAt(0) || "U").toUpperCase()}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="max-w-32 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {name || "User"}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isAdmin ? "Admin" : "Resident"}
                  </p>
                </div>

                <span className="text-gray-500 dark:text-gray-400">
                  ▾
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <div className="border-b border-gray-100 px-3 py-3 dark:border-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {name || "User"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {isAdmin ? "Administrator" : "Resident"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}