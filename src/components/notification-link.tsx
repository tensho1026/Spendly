import Link from "next/link";
import { Bell } from "lucide-react";
import { connection } from "next/server";
import { getNotifications } from "@/lib/notifications";

function NotificationLinkView({ count = 0 }: { count?: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={`通知${count ? `${count}件` : ""}`}
      className="relative rounded-full border p-2 hover:bg-accent"
    >
      <Bell className="size-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export function NotificationLinkFallback() {
  return <NotificationLinkView />;
}

export async function NotificationLink() {
  await connection();
  const count = (await getNotifications()).length;
  return <NotificationLinkView count={count} />;
}
