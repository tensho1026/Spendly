import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Spendly | わたしの家計簿", template: "%s | Spendly" },
  description:
    "毎日の支出をかんたんに記録。カテゴリ別の集計で、お金の流れを見える化する家計簿。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
