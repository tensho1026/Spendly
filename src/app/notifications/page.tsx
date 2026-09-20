import { AlertTriangle, Bell, CircleAlert, Info } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const icons = { info: Info, warning: AlertTriangle, danger: CircleAlert };
const styles = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

export default async function NotificationsPage() {
  const items = await getNotifications();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bell className="size-6" />
          通知
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          今月の予算・入力状況・固定費の支払日をまとめて確認できます。
        </p>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = icons[item.level];
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex gap-3 rounded-xl border p-4 transition hover:shadow-sm ${styles[item.level]}`}
              >
                <Icon className="mt-0.5 size-5 shrink-0" />
                <span>
                  <strong className="block">{item.title}</strong>
                  <small className="mt-1 block opacity-80">
                    {item.description}
                  </small>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Bell className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">現在の通知はありません</p>
          <p className="mt-1 text-sm text-muted-foreground">
            入力や予算の状況に応じて、ここに表示されます。
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard">ダッシュボードへ戻る</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
