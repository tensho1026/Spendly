import Link from "next/link";
import { Plus } from "lucide-react";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { DailyList } from "@/components/expenses/daily-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { getDays, getFixed, summarizeDays } from "@/lib/ledger";
import { sumItems } from "@/lib/ledger-validation";
import { formatMonthJP, formatYen } from "@/lib/format";
import { currentMonth, parseMonthParam, formatMonthParam } from "@/lib/month";
export const dynamic = "force-dynamic";
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const month = parseMonthParam(first(params.month)),
    period = formatMonthParam(month);
  const [days, fixed] = await Promise.all([getDays(month), getFixed(period)]);
  const summary = summarizeDays(days),
    fixedTotal = sumItems(fixed);
  const selected = summary.breakdown.find(
    (item) => item.categoryId === first(params.category),
  );
  const visibleDays = selected
    ? days.filter((day) =>
        day.items.some((item) => item.categoryId === selected.categoryId),
      )
    : days;
  const mismatchedDays = days.filter(
    (day) => day.total !== sumItems(day.items),
  ).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSwitcher month={month} today={currentMonth()} />
          <Button asChild size="sm">
            <Link href="/expenses/new">
              <Plus className="size-4" />
              1日分を記録
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {formatMonthJP(month.year, month.month)}のお金の流れ
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "月の支出合計",
            value: summary.total + fixedTotal,
            note: "日々の支出 ＋ 固定費",
          },
          {
            label: "日々の支出",
            value: summary.total,
            note: `${days.length}日分の合計`,
            href: `/expenses?month=${period}`,
          },
          {
            label: "月の固定費",
            value: fixedTotal,
            note: `${fixed.length}件の固定費`,
            href: `/fixed-expenses?month=${period}`,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="break-all text-3xl font-bold tabular-nums">
                {formatYen(stat.value)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{stat.note}</p>
              {stat.href && (
                <Link
                  href={stat.href}
                  className="mt-3 inline-block text-xs font-semibold text-primary"
                >
                  確認・編集する →
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {mismatchedDays > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          合計と内訳に差額がある日が{mismatchedDays}
          日あります。月の支出には各日の入力済み合計を使っています。
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">日々の支出・カテゴリ別</CardTitle>
            <CardDescription>
              入力済みの内訳 {formatYen(summary.itemTotal)}{" "}
              の割合です。固定費は含みません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryChart
              data={summary.breakdown}
              selectedCategoryId={selected?.categoryId}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">カテゴリ別の金額</CardTitle>
            <CardDescription>
              カテゴリを選ぶと、その内訳を含む日を下に表示します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown
              data={summary.breakdown}
              total={summary.itemTotal}
              month={period}
              selectedCategoryId={selected?.categoryId}
            />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            {selected ? `${selected.name}を含む日` : "最近の日々の支出"}
          </h2>
          <Link
            href={`/expenses?month=${period}`}
            className="text-sm text-primary"
          >
            この月のすべてを見る →
          </Link>
        </div>
        <DailyList days={visibleDays.slice(0, 5)} />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">この月の固定費</CardTitle>
            <Link
              href={`/fixed-expenses?month=${period}`}
              className="text-sm text-primary"
            >
              入力・編集 →
            </Link>
          </div>
          <CardDescription>
            日ごとの合計とは別に管理しています。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fixed.length ? (
            <ul className="divide-y">
              {fixed.map((item) => (
                <li key={item.id} className="py-3">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{item.category.name}</span>
                    <span className="shrink-0 font-semibold">
                      {formatYen(item.amount)}
                    </span>
                  </div>
                  {item.memo && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {item.memo}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              この月の固定費はまだありません。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
