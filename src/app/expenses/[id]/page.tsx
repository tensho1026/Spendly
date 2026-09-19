import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getDaily } from "@/lib/ledger";
import { differenceLabel, sumItems } from "@/lib/ledger-validation";
import { formatDateJP, formatYen } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteExpenseDialog } from "@/components/expenses/delete-expense-dialog";
export const dynamic = "force-dynamic";
export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const day = await getDaily((await params).id);
  if (!day) notFound();
  const itemTotal = sumItems(day.items),
    difference = day.total - itemTotal;
  return (
    <div className="space-y-6">
      <Link href="/expenses" className="text-sm text-muted-foreground">
        ← 日々の支出
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{formatDateJP(day.date)}</h1>
        <Button asChild>
          <Link href={`/expenses/${day.id}/edit`}>
            <Pencil className="size-4" />
            合計・内訳を編集
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            1日の出費合計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tabular-nums">
            {formatYen(day.total)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>この日の内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {day.items.map((item) => (
              <li key={item.id} className="py-4 first:pt-0">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{item.category.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatYen(item.amount)}
                  </span>
                </div>
                {item.memo && (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {item.memo}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {!day.items.length && (
            <p className="py-4 text-sm text-muted-foreground">
              内訳はまだ入力されていません。
            </p>
          )}
          <div className="mt-4 space-y-3 rounded-lg bg-secondary/60 p-4 text-sm">
            <div className="flex justify-between">
              <span>内訳の合計</span>
              <span className="font-semibold">{formatYen(itemTotal)}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span>{differenceLabel(difference)}</span>
              <span>{formatYen(Math.abs(difference))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <DeleteExpenseDialog expense={day} />
      </div>
    </div>
  );
}
