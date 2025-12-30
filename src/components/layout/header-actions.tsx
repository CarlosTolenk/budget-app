"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./navigation";

export function HeaderActions() {
  const pathname = usePathname();

  if (pathname.startsWith("/login")) {
    return null;
  }

  return <Navigation />;
}
