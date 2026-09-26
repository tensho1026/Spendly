"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Settings,
  Wallet,
  CalendarDays,
  Target,
  Banknote,
  Plus,
  ArrowUpRight,
  ChartNoAxesCombined,
  Heart,
  BookCheck,
} from "lucide-react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/expenses", label: "日々の支出", icon: ReceiptText },
  { href: "/income", label: "収入", icon: Banknote },
  { href: "/budgets", label: "月間予算", icon: Target },
  { href: "/fixed-expenses", label: "月の固定費", icon: CalendarDays },
  { href: "/reports", label: "レポート", icon: ChartNoAxesCombined },
  { href: "/monthly-review", label: "月締め・振り返り", icon: BookCheck },
  { href: "/wishlist", label: "ほしいものリスト", icon: Heart },
  { href: "/settings", label: "設定", icon: Settings },
];

const mobileLinks = links.filter((link) => ["/dashboard","/expenses","/income","/reports","/settings"].includes(link.href));
export function AppShell({ children, notificationLink }: { children: ReactNode; notificationLink: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:p-3"
      >
        本文へスキップ
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col overflow-y-auto border-r bg-white px-5 py-8 md:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 text-2xl font-bold tracking-tight"
        >
          <span className="rounded-xl bg-primary p-2 text-white">
            <Wallet className="size-6" />
          </span>
          Spendly<span className="text-primary">.</span>
        </Link>
        <p className="mt-3 px-3 text-xs text-muted-foreground">
          毎日のお金を、もっとクリアに。
        </p>
        <p className="mt-12 px-3 text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
          WORKSPACE
        </p>
        <nav aria-label="メインメニュー" className="mt-4 space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-muted",
                pathname.startsWith(href)
                  ? "bg-secondary font-semibold text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl bg-secondary p-4">
          <p className="text-sm font-semibold text-secondary-foreground">
            小さな記録、大きな気づき。
          </p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            今日の支出を記録して、お金の流れを見える化しましょう。
          </p>
          <Link
            href="/expenses/new"
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary"
          >
            支出を記録する
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <p className="mt-6 px-3 text-[10px] tracking-widest text-muted-foreground">
          SPENDLY · PERSONAL FINANCE
        </p>
      </aside>
      <div className="md:pl-60">
        <header className="flex h-20 items-center justify-between border-b bg-white/90 px-5 sm:px-8 lg:px-12">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold md:hidden"
          >
            <Wallet className="size-5 text-primary" />
            Spendly.
          </Link>
          <span className="hidden text-sm text-muted-foreground md:block">
            わたしの家計簿 <span className="mx-3 text-border">/</span>{" "}
            <span className="text-foreground">
              {links.find((x) => pathname.startsWith(x.href))?.label ??
                "Spendly"}
            </span>
          </span>
          <div className="flex items-center gap-2">{notificationLink}<Link href="/expenses/new" className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium hover:bg-accent"><Plus className="size-4 text-primary" />支出を記録</Link></div>
        </header>
        <main
          id="main"
          className="mx-auto max-w-7xl px-4 py-7 pb-28 sm:px-8 md:pb-12 lg:px-12 lg:py-10"
        >
          {children}
        </main>
      </div>
      <nav
        aria-label="モバイルメニュー"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {mobileLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-[11px]",
              pathname.startsWith(href)
                ? "font-bold text-primary"
                : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
