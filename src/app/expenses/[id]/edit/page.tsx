import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDaily, getTemplates } from "@/lib/ledger";
import { getCategoriesWithSub } from "@/lib/queries";
import { toDateInputValue } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [day, categories, templates] = await Promise.all([
    getDaily(id),
    getCategoriesWithSub(),
    getTemplates(),
  ]);
  if (!day) notFound();
  return (
    <div className="space-y-6">
      <Link
        href={`/expenses/${day.id}`}
        className="text-sm text-muted-foreground"
      >
        ← この日の記録に戻る
      </Link>
      <h1 className="text-2xl font-bold">1日分の支出を編集</h1>
      <Card>
        <CardHeader>
          <CardTitle>合計と内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            mode="daily"
            categories={categories}
            period={toDateInputValue(day.date)}
            record={day}
            templates={templates}
          />
        </CardContent>
      </Card>
    </div>
  );
}
