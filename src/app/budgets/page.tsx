import { BudgetForm } from "@/components/budgets/budget-form";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBudgets } from "@/lib/ledger";
import { getCategoriesWithSub } from "@/lib/queries";
import { currentMonth, formatMonthParam, parseMonthParam } from "@/lib/month";
export const dynamic = "force-dynamic";
export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[]; saved?: string }> }) {
  const params = await searchParams;
  const month = parseMonthParam(Array.isArray(params.month) ? params.month[0] : params.month);
  const period = formatMonthParam(month);
  const [categories, budgets] = await Promise.all([getCategoriesWithSub(), getBudgets(period)]);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">カテゴリ別の月間予算</h1><p className="mt-2 text-sm text-muted-foreground">カテゴリごとの上限を決め、ダッシュボードで使用率を確認できます。</p></div><MonthSwitcher month={month} today={currentMonth()} basePath="/budgets" /></div>
    {params.saved === "1" && <p role="status" className="rounded-lg border bg-secondary p-3 text-sm text-primary">この月の予算を保存しました</p>}
    <Card><CardHeader><CardTitle>{month.year}年{month.month}月の予算</CardTitle><CardDescription>日々の内訳と固定費のうち、同じカテゴリの金額を予算から使用済みとして集計します。</CardDescription></CardHeader><CardContent><BudgetForm key={period} month={period} categories={categories} budgets={budgets} /></CardContent></Card>
  </div>;
}
