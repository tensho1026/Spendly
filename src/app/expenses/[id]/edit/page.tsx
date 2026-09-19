import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ExpenseForm } from "@/components/expenses/expense-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategoriesWithSub, getExpenseById } from "@/lib/queries";

export const dynamic = "force-dynamic";

type EditExpensePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const { id } = await params;
  const [expense, categories] = await Promise.all([
    getExpenseById(id),
    getCategoriesWithSub(),
  ]);

  if (!expense) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/expenses/${expense.id}`}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            支出の詳細に戻る
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">支出を編集</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>支出の内容</CardTitle>
          <CardDescription>金額・日付・大カテゴリは必須です。</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm mode="edit" expense={expense} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
