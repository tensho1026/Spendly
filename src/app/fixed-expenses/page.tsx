import { ExpenseForm } from "@/components/expenses/expense-form";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getFixed } from "@/lib/ledger";
import { getCategoriesWithSub } from "@/lib/queries";
import { currentMonth, formatMonthParam, parseMonthParam } from "@/lib/month";
import { shiftMonth } from "@/lib/month";
import { CopyPreviousButton } from "@/components/fixed/copy-previous-button";
export const dynamic = "force-dynamic";
export default async function FixedExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[]; saved?: string; copied?: string; error?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthParam(
    Array.isArray(params.month) ? params.month[0] : params.month,
  );
  const period = formatMonthParam(month);
  const previous = shiftMonth(month, -1);
  const [items, categories] = await Promise.all([
    getFixed(period),
    getCategoriesWithSub(),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">月の固定費</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            家賃・通信費・サブスクなどを、日々の支出と分けて記録。
          </p>
        </div>
        <div className="flex flex-wrap gap-2"><CopyPreviousButton month={period} previousLabel={`${previous.year}年${previous.month}月`} hasCurrent={items.length > 0} /><MonthSwitcher month={month} today={currentMonth()} basePath="/fixed-expenses" /></div>
      </div>
      {params.saved === "1" && (
        <p
          role="status"
          className="rounded-lg border bg-secondary p-3 text-sm text-primary"
        >
          この月の固定費を保存しました
        </p>
      )}
      {params.copied === "1" && <p role="status" className="rounded-lg border bg-secondary p-3 text-sm text-primary">前月の固定費をコピーしました。金額が変わったものを修正して保存できます。</p>}
      {params.error === "no-source" && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">前月にコピーできる固定費がありません。</p>}
      <Card>
        <CardHeader>
          <CardTitle>
            {month.year}年{month.month}月の固定費
          </CardTitle>
          <CardDescription>
            この月だけの金額とメモを入力してください。他の月には自動で追加されません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            key={period}
            mode="fixed"
            period={period}
            categories={categories}
            items={items}
          />
        </CardContent>
      </Card>
    </div>
  );
}
