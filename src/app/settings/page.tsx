import Link from "next/link";
import { ChevronRight, Tags } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SETTINGS_LINKS = [
  {
    href: "/settings/categories",
    title: "カテゴリ管理",
    description: "大カテゴリと詳細カテゴリの追加・名前の変更・削除ができます。",
    icon: Tags,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground">
          Spendly の設定を変更できます。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-xl">
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-md border bg-muted/50 p-2">
                    <item.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    className="mt-2 size-4 shrink-0 text-muted-foreground"
                  />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
