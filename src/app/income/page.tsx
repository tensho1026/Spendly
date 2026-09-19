import { IncomeManager } from "@/components/income/income-manager";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatYen, toDateInputValue } from "@/lib/format";
import { getIncomes } from "@/lib/ledger";
import { currentMonth, parseMonthParam } from "@/lib/month";
export const dynamic = "force-dynamic";
export default async function IncomePage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const params = await searchParams;
  const month = parseMonthParam(Array.isArray(params.month) ? params.month[0] : params.month);
  const incomes = await getIncomes(month);
  const total = incomes.reduce((sum, income) => sum + income.amount, 0);
  const today = new Date(), now = currentMonth();
  const defaultDate = month.year === now.year && month.month === now.month ? toDateInputValue(today) : `${month.year}-${String(month.month).padStart(2,"0")}-01`;
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">収入管理</h1><p className="mt-2 text-sm text-muted-foreground">給料・賞与・臨時収入を月ごとに記録します。</p></div><MonthSwitcher month={month} today={now} basePath="/income" /></div><Card><CardHeader><CardTitle>{month.year}年{month.month}月の収入</CardTitle><CardDescription>{incomes.length}件 · 合計 {formatYen(total)}</CardDescription></CardHeader><CardContent><IncomeManager incomes={incomes} defaultDate={defaultDate} /></CardContent></Card></div>;
}
