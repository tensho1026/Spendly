import Link from "next/link";
import { ChevronRight, Tags, Zap, RefreshCw, Tag, Heart, BookCheck, Target } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SETTINGS_LINKS = [
  { href: "/wishlist", title: "ほしいものリスト", description: "購入候補の金額やメモを保存し、購入したら支出に記録できます。", icon: Heart },
  { href: "/monthly-review", title: "月締め・振り返り", description: "入力状況を確認して、毎月の気づきや来月の目標を残せます。", icon: BookCheck },
  { href: "/budgets", title: "月間予算", description: "生活費とカテゴリ別予算を設定できます。", icon: Target },
  {
    href: "/settings/categories",
    title: "カテゴリ管理",
    description:
      "日々の支出と固定費で使うカテゴリの追加・名前の変更・削除ができます。",
    icon: Tags,
  },
  {
    href: "/settings/templates",
    title: "よく使う内訳",
    description: "昼食や電車など、よく入力するカテゴリ・金額・メモを登録できます。",
    icon: Zap,
  },
  {
    href: "/settings/recurring-fixed",
    title: "固定費の自動作成",
    description: "家賃やサブスクを、指定した支払日で毎月自動追加します。",
    icon: RefreshCw,
  },
  {
    href: "/settings/tags",
    title: "タグ管理",
    description: "旅行・仕事・家族など、カテゴリとは別の分類を自由に作成できます。",
    icon: Tag,
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
