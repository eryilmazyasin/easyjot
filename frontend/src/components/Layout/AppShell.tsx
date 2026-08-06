"use client";

import { ChartNoAxesColumnIncreasing, History, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppShellProps } from "./AppShell.types";

const navigationItems = [
  { href: "/", label: "Özet", icon: ChartNoAxesColumnIncreasing },
  { href: "/history", label: "Geçmiş", icon: History },
  { href: "/settings", label: "Ayarlar", icon: Settings },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <main className="min-h-dvh">{children}</main>;
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[760px] border-x border-line/60 bg-canvas/80">
      <header className="safe-top flex items-center justify-between px-5 pb-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="EasyJot ana sayfa">
          <span className="grid size-9 place-items-center rounded-xl bg-forest text-sm font-black text-paper">
            E
          </span>
          <span className="text-[1.05rem] font-bold tracking-[-0.03em]">EasyJot</span>
        </Link>
        <span className="rounded-full border border-line bg-paper/70 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-muted">
          Bu ay
        </span>
      </header>

      <main className="min-h-[calc(100dvh-9rem)] px-5 pb-28 sm:px-8">{children}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[760px] border-t border-line bg-paper/95 px-5 pt-2 backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.68rem] font-semibold transition-colors ${
                  isActive ? "bg-forest text-paper" : "text-muted hover:bg-canvas hover:text-ink"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-[1.15rem]" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
