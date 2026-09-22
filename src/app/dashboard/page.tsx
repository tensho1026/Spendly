import Link from "next/link";
import { Plus, ArrowDown, ArrowUp, Minus, Target } from "lucide-react";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { DailyList } from "@/components/expenses/daily-list";
import { InputCalendar } from "@/components/dashboard/input-calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ensureRecurringFixed, getBudgets, getDashboardDays, getDashboardIncome, getFixed, getPreviousMonthSpend, summarizeDays } from "@/lib/ledger";
import { sumItems } from "@/lib/ledger-validation";
import { formatMonthJP, formatYen } from "@/lib/format";
import { currentMonth, parseMonthParam, formatMonthParam, shiftMonth } from "@/lib/month";
import { combineCategorySpend, percentage } from "@/lib/planning";
import { savingsRate } from "@/lib/cashflow";
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
  const previousMonth = shiftMonth(month, -1);
  const [days, fixed, budgets, previous, income] = await Promise.all([
    getDashboardDays(month),
    ensureRecurringFixed(period).then(() => getFixed(period)),
    getBudgets(period),
    getPreviousMonthSpend(previousMonth),
    getDashboardIncome(month),
  ]);
  const summary = summarizeDays(days),
    fixedTotal = sumItems(fixed);
  const monthTotal = summary.total + fixedTotal, previousTotal = previous.total, monthDelta = monthTotal - previousTotal;
  const incomeTotal = income.total, balance = incomeTotal - monthTotal, rate = savingsRate(incomeTotal, monthTotal);
  const currentCategorySpend = combineCategorySpend(summary.breakdown.map((row) => ({ ...row, amount: row.total })), fixed.map((row) => ({ categoryId: row.categoryId, name: row.category.name, amount: row.amount })));
  const previousByCategory = previous.byCategory;
  const usedByCategory = new Map(currentCategorySpend.map((row) => [row.categoryId, row.amount]));
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "月の収入",
            value: incomeTotal,
            note: `${income.count}件の収入`,
            href: `/income?month=${period}`,
          },
          {
            label: "月の支出合計",
            value: monthTotal,
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
      <Card className={balance < 0 ? "border-rose-200" : "border-emerald-200"}><CardHeader><CardTitle className="text-base">今月の収支</CardTitle><CardDescription>収入 − 支出</CardDescription></CardHeader><CardContent><div className="flex flex-wrap items-end justify-between gap-3"><div><p className={`text-4xl font-bold tabular-nums ${balance < 0 ? "text-rose-700" : "text-emerald-700"}`}>{formatYen(balance)}</p><p className="mt-2 text-sm text-muted-foreground">収入 {formatYen(incomeTotal)} − 支出 {formatYen(monthTotal)}</p></div><div className="rounded-xl bg-muted px-4 py-3 text-right"><p className="text-xs text-muted-foreground">貯蓄率</p><p className="text-2xl font-bold tabular-nums">{rate === null ? "—" : `${rate}%`}</p></div></div></CardContent></Card>
      <Card>
        <CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle className="text-base">前月との比較</CardTitle><CardDescription>{previousMonth.year}年{previousMonth.month}月の合計 {formatYen(previousTotal)} と比較</CardDescription></div><span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${monthDelta > 0 ? "bg-rose-50 text-rose-700" : monthDelta < 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{monthDelta > 0 ? <ArrowUp className="size-4" /> : monthDelta < 0 ? <ArrowDown className="size-4" /> : <Minus className="size-4" />}{monthDelta === 0 ? "増減なし" : `前月より${formatYen(Math.abs(monthDelta))}${monthDelta > 0 ? "増加" : "減少"}`}</span></div></CardHeader>
        <CardContent>{currentCategorySpend.length ? <div className="grid gap-2 sm:grid-cols-2">{currentCategorySpend.map((row) => { const delta = row.amount - (previousByCategory.get(row.categoryId) ?? 0); return <div key={row.categoryId} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{row.name}</span><span className="text-right font-medium">{formatYen(row.amount)}<small className={`ml-2 ${delta > 0 ? "text-rose-600" : delta < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>{delta === 0 ? "±0" : `${delta > 0 ? "+" : "-"}${formatYen(Math.abs(delta))}`}</small></span></div>; })}</div> : <p className="text-sm text-muted-foreground">比較できるカテゴリ別支出はまだありません。</p>}</CardContent>
      </Card>
      <Card>
        <CardHeader><div className="flex items-center justify-between gap-2"><div><CardTitle className="flex items-center gap-2 text-base"><Target className="size-4 text-primary" />カテゴリ別予算</CardTitle><CardDescription>日々の内訳と固定費を合わせた使用状況です。</CardDescription></div><Link href={`/budgets?month=${period}`} className="text-sm text-primary">予算を設定 →</Link></div></CardHeader>
        <CardContent>{budgets.length ? <div className="space-y-4">{budgets.map((budget) => { const used = usedByCategory.get(budget.categoryId) ?? 0, ratio = percentage(used, budget.amount), remaining = budget.amount - used; return <div key={budget.id}><div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{budget.category.name}</span><span className={remaining < 0 ? "font-semibold text-rose-700" : "text-muted-foreground"}>{formatYen(used)} / {formatYen(budget.amount)} · {remaining < 0 ? `${formatYen(Math.abs(remaining))}超過` : `残り${formatYen(remaining)}`}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${ratio > 100 ? "bg-rose-500" : ratio >= 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${Math.min(ratio, 100)}%` }} /></div><p className="mt-1 text-right text-xs text-muted-foreground">{ratio}%</p></div>; })}</div> : <p className="text-sm text-muted-foreground">この月の予算はまだ設定されていません。</p>}</CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-base">入力状況カレンダー</CardTitle><CardDescription>金額を押すと記録を確認できます。未入力の日を押すと、その日の日付で入力を始めます。</CardDescription></CardHeader><CardContent><InputCalendar month={month} days={days.map((day) => ({ id: day.id, date: day.date, total: day.total, itemTotal: sumItems(day.items) }))} /></CardContent></Card>
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
                  {item.dueDay && <p className="mt-1 text-xs text-muted-foreground">毎月{item.dueDay}日</p>}
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
