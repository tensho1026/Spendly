import Link from "next/link";
import { Plus } from "lucide-react";

import {
  ExpenseFilters,
  type ExpenseFilterValues,
} from "@/components/expenses/expense-filters";
import { ExpenseList } from "@/components/expenses/expense-list";
import { Button } from "@/components/ui/button";
import { formatYen } from "@/lib/format";
import { getCategoriesWithSub, getExpenses } from "@/lib/queries";
import type { ExpenseFilters as ExpenseQueryFilters } from "@/lib/queries";

export const dynamic = "force-dynamic";

type ExpensesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 同じキーが複数回来た場合は最初の値を使い、空文字は未指定として扱う。 */
function firstValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function parseAmount(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const resolvedSearchParams = await searchParams;

  const values: ExpenseFilterValues = {
    month: firstValue(resolvedSearchParams.month),
    from: firstValue(resolvedSearchParams.from),
    to: firstValue(resolvedSearchParams.to),
    minAmount: firstValue(resolvedSearchParams.minAmount),
    maxAmount: firstValue(resolvedSearchParams.maxAmount),
    categoryId: firstValue(resolvedSearchParams.categoryId),
    subcategoryId: firstValue(resolvedSearchParams.subcategoryId),
    merchant: firstValue(resolvedSearchParams.merchant),
    keyword: firstValue(resolvedSearchParams.keyword),
  };

  // 何も指定がなければ全期間を対象にする（今月をデフォルト適用しない）。
  const filters: ExpenseQueryFilters = {
    month: values.month,
    from: values.from,
    to: values.to,
    minAmount: parseAmount(values.minAmount),
    maxAmount: parseAmount(values.maxAmount),
    categoryId: values.categoryId,
    subcategoryId: values.subcategoryId,
    merchant: values.merchant,
    keyword: values.keyword,
  };

  const [categories, expenses] = await Promise.all([
    getCategoriesWithSub(),
    getExpenses(filters),
  ]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  // URL の条件が変わったら絞り込みフォームの入力状態も作り直す。
  const filtersKey = Object.entries(values)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">支出一覧</h1>
          <p className="text-sm text-muted-foreground">
            {expenses.length}件 / 合計{" "}
            <span className="tabular-nums">{formatYen(total)}</span>
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/expenses/new">
            <Plus className="size-4" aria-hidden="true" />
            支出を追加
          </Link>
        </Button>
      </div>

      <ExpenseFilters
        key={filtersKey}
        categories={categories}
        values={values}
      />

      <ExpenseList expenses={expenses} />
    </div>
  );
}
