"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavbarProps = {
  role: "ADMIN" | "RESIDENT";
  name?: string | null;
  email?: string | null;
};

export default function Navbar({
  role,
  name,
  email,
}: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const residentLinks = [
    {
      label: "Dashboard",
      href: "/resident/dashboard",
    },
    {
      label: "Complaints",
      href: "/resident/complaints",
    },
    {
      label: "Notices",
      href: "/resident/notices",
    },
  ];

  const adminLinks = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
    },
    {
      label: "Complaints",
      href: "/admin/complaints",
    },
    {
      label: "Notices",
      href: "/admin/notices",
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
    },
  ];

  const links =
    role === "ADMIN" ? adminLinks : residentLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href={
            role === "ADMIN"
              ? "/admin/dashboard"
              : "/resident/dashboard"
          }
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            SP
          </div>

          <span className="text-lg font-bold text-gray-900 dark:text-white">
            SocietyPulse
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Account */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {(name?.charAt(0) || email?.charAt(0) || "U").toUpperCase()}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-32 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {name || "User"}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {role === "ADMIN" ? "Admin" : "Resident"}
              </p>
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              ▾
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="border-b border-gray-100 px-3 py-3 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {name || "User"}
                </p>

                <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                  {email || "No email available"}
                </p>

                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {role}
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="border-t border-gray-100 px-4 py-2 md:hidden dark:border-gray-800">
        <nav className="flex gap-2 overflow-x-auto">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}