import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { HeaderActions } from "@/components/layout/header-actions";
import { GlobalLoadingBar } from "@/components/layout/global-loading-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Presupuesto 50/30/20",
  description:
    "Dashboard inteligente para presupuestos personales con importación automática desde emails bancarios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-slate-950 text-white">
          <GlobalLoadingBar />
          <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight text-white">
                <span className="md:hidden">Presupuesto</span>
                <span className="hidden md:inline">Presupuesto 50/30/20</span>
              </Link>
              <HeaderActions />
            </div>
          </header>
          <main className="mx-auto min-h-[calc(100vh-80px)] max-w-6xl px-6 py-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
