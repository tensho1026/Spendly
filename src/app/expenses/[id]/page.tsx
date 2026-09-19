import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";

import { DeleteExpenseDialog } from "@/components/expenses/delete-expense-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateJP, formatYen } from "@/lib/format";
import { getExpenseById } from "@/lib/queries";

export const dynamic = "force-dynamic";

type ExpenseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExpenseDetailPage({
  params,
}: ExpenseDetailPageProps) {
  const { id } = await params;
  const expense = await getExpenseById(id);

  if (!expense) {
    notFound();
  }

  const merchant = expense.merchant?.trim() || "—";
  const memo = expense.memo?.trim() || "—";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/expenses">
          <ChevronLeft className="size-4" aria-hidden="true" />
          支出一覧に戻る
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold tabular-nums">
            {formatYen(expense.amount)}
          </CardTitle>
          <CardDescription>{formatDateJP(expense.date)}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{expense.category.name}</Badge>
            {expense.subcategory ? (
              <>
                <span className="text-muted-foreground" aria-hidden="true">
                  ›
                </span>
                <Badge variant="outline">{expense.subcategory.name}</Badge>
              </>
            ) : null}
          </div>

          <Separator />

          <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-[6rem_1fr]">
            <dt className="text-sm text-muted-foreground">支出先</dt>
            <dd className="text-sm break-words">{merchant}</dd>
            <dt className="text-sm text-muted-foreground">メモ</dt>
            <dd className="text-sm break-words whitespace-pre-wrap">{memo}</dd>
          </dl>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/expenses/${expense.id}/edit`}>
              <Pencil className="size-4" aria-hidden="true" />
              編集
            </Link>
          </Button>
          <DeleteExpenseDialog expense={expense} />
        </CardFooter>
      </Card>
    </div>
  );
}
