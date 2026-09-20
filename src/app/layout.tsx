import type { Metadata } from "next";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { getNotifications } from "@/lib/notifications";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Spendly | わたしの家計簿", template: "%s | Spendly" },
  description:
    "毎日の支出をかんたんに記録。カテゴリ別の集計で、お金の流れを見える化する家計簿。",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const notificationCount = (await getNotifications()).length;
  return (
    <html lang="ja">
      <body>
        <AppShell notificationCount={notificationCount}>{children}</AppShell>
      </body>
    </html>
  );
}
