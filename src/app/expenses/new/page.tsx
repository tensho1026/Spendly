import Link from "next/link";
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
import { getCategoriesWithSub } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const categories = await getCategoriesWithSub();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/expenses">
            <ChevronLeft className="size-4" aria-hidden="true" />
            支出一覧に戻る
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">支出を追加</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>支出の内容</CardTitle>
          <CardDescription>金額・日付・大カテゴリは必須です。</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm mode="create" categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
