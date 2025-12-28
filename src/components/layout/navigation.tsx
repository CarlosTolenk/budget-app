"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/budget", label: "Presupuesto" },
  { href: "/transactions", label: "Transacciones" },
  { href: "/stats", label: "Estadísticas" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-3 text-sm">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-full px-4 py-2 transition",
              isActive ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/10",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
