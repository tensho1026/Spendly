import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatShortDate, formatYen } from "@/lib/format";
import type { ExpenseWithRelations } from "@/lib/queries";

type RecentExpensesProps = {
  expenses: ExpenseWithRelations[];
};

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        title="支出がありません"
        description="この月にはまだ支出が登録されていません。"
        action={
          <Button asChild size="sm">
            <Link href="/expenses/new">支出を追加</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y">
        {expenses.map((expense) => {
          const title = expense.subcategory?.name ?? expense.category.name;
          const details = [
            expense.subcategory ? expense.category.name : null,
            expense.merchant,
          ].filter((value): value is string => Boolean(value));

          return (
            <li key={expense.id}>
              <Link
                href={`/expenses/${expense.id}`}
                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
              >
                <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatShortDate(expense.date)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {title}
                  </span>
                  {details.length > 0 ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {details.join(" ・ ")}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatYen(expense.amount)}
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="w-full justify-center"
      >
        <Link href="/expenses">
          すべての支出を見る
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
