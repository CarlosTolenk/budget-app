"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./navigation";
import { NotificationsBell } from "./notifications-bell";

export function HeaderActions() {
  const pathname = usePathname();

  if (pathname.startsWith("/login")) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-wrap items-center gap-3 md:justify-end">
      <Navigation />
      <div className="ml-auto md:ml-0">
        <NotificationsBell />
      </div>
    </div>
  );
}
