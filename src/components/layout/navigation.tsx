"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LogoutButton } from "./logout-button";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/budget", label: "Presupuesto" },
  { href: "/transactions", label: "Transacciones" },
  { href: "/stats", label: "Estadísticas" },
];

type RenderOptions = {
  extraClasses?: string;
  closeOnClick?: boolean;
};

export function Navigation() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderLinks = ({ extraClasses, closeOnClick }: RenderOptions = {}) =>
    links.map((link) => {
      const isActive = pathname === link.href;
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={
            closeOnClick
              ? () => {
                  setIsMobileOpen(false);
                }
              : undefined
          }
          className={clsx(
            "rounded-full px-4 py-2 text-sm transition",
            extraClasses,
            isActive
              ? "bg-white text-slate-900"
              : "text-slate-200 hover:bg-white/10 hover:text-white",
          )}
        >
          {link.label}
        </Link>
      );
    });

  return (
    <nav className="contents" aria-label="Navegación principal">
      <div className="flex items-center gap-3 text-sm">
        <div className="hidden gap-3 md:flex">{renderLinks()}</div>
        <div className="hidden md:block">
          <LogoutButton />
        </div>
        <div className="flex justify-end md:hidden">
          <button
            type="button"
            aria-expanded={isMobileOpen}
            aria-controls="main-navigation"
            onClick={() => setIsMobileOpen((open) => !open)}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            {isMobileOpen ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      <div
        id="main-navigation"
        className={clsx(
          "mt-3 w-full flex-col gap-2 md:hidden",
          isMobileOpen ? "flex" : "hidden",
        )}
      >
        {renderLinks({ extraClasses: "w-full text-center", closeOnClick: true })}
        <LogoutButton fullWidth />
      </div>
    </nav>
  );
}
