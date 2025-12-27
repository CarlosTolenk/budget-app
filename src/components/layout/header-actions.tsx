"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./navigation";
import { LogoutButton } from "./logout-button";

export function HeaderActions() {
  const pathname = usePathname();

  if (pathname.startsWith("/login")) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Navigation />
      <LogoutButton />
    </div>
  );
}
