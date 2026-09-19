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
export const dynamic = "force-dynamic";
export default async function FixedExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[]; saved?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthParam(
    Array.isArray(params.month) ? params.month[0] : params.month,
  );
  const period = formatMonthParam(month);
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
        <MonthSwitcher
          month={month}
          today={currentMonth()}
          basePath="/fixed-expenses"
        />
      </div>
      {params.saved === "1" && (
        <p
          role="status"
          className="rounded-lg border bg-secondary p-3 text-sm text-primary"
        >
          この月の固定費を保存しました
        </p>
      )}
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
