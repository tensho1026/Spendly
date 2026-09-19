import Link from "next/link";
import { ExpenseForm } from "@/components/expenses/expense-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { getCategoriesWithSub } from "@/lib/queries";
import { dateInputToUtc, toDateInputValue } from "@/lib/format";
import { getTags, getTemplates } from "@/lib/ledger";
export const dynamic = "force-dynamic";
export default async function NewExpensePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const requested = (await searchParams).date ?? "";
  const period = dateInputToUtc(requested) ? requested : toDateInputValue(new Date());
  const [categories, templates, tags] = await Promise.all([getCategoriesWithSub(), getTemplates(), getTags()]);
  return (
    <div className="space-y-6">
      <Link href="/expenses" className="text-sm text-muted-foreground">
        ← 日々の支出
      </Link>
      <h1 className="text-2xl font-bold">1日分の支出を記録</h1>
      <Card>
        <CardHeader>
          <CardTitle>合計と内訳</CardTitle>
          <CardDescription>
            1日の合計を入力し、カテゴリごとの金額とメモを追加してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            mode="daily"
            categories={categories}
            period={period}
            templates={templates}
            tags={tags}
          />
        </CardContent>
      </Card>
    </div>
  );
}
