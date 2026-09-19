import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMonthJP, formatShortDate, formatYen } from "@/lib/format";
import type { ExpenseWithRelations } from "@/lib/queries";

export type ExpenseListProps = {
  expenses: ExpenseWithRelations[];
};

type MonthGroup = {
  key: string;
  year: number;
  month: number;
  total: number;
  expenses: ExpenseWithRelations[];
};

/** date 降順、同じ日なら createdAt 降順。 */
function sortExpenses(
  expenses: ExpenseWithRelations[],
): ExpenseWithRelations[] {
  return [...expenses].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function groupByMonth(expenses: ExpenseWithRelations[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const expense of expenses) {
    const date = new Date(expense.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const group = groups.get(key);

    if (group) {
      group.total += expense.amount;
      group.expenses.push(expense);
    } else {
      groups.set(key, {
        key,
        year,
        month,
        total: expense.amount,
        expenses: [expense],
      });
    }
  }

  return Array.from(groups.values());
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        title="支出がありません"
        description="条件を変えて検索するか、新しい支出を追加してください。"
        action={
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="size-4" />
              支出を追加
            </Link>
          </Button>
        }
      />
    );
  }

  const groups = groupByMonth(sortExpenses(expenses));

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section
          key={group.key}
          className="overflow-hidden rounded-lg border bg-card"
        >
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2">
            <h2 className="text-sm font-semibold">
              {formatMonthJP(group.year, group.month)}
            </h2>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              {formatYen(group.total)}
            </span>
          </div>
          <ul className="divide-y">
            {group.expenses.map((expense) => {
              const label = expense.subcategory?.name ?? expense.category.name;
              const detail =
                expense.merchant?.trim() || expense.memo?.trim() || "";

              return (
                <li key={expense.id}>
                  <Link
                    href={`/expenses/${expense.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  >
                    <span className="w-12 shrink-0 text-sm tabular-nums text-muted-foreground">
                      {formatShortDate(expense.date)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {label}
                      </span>
                      {detail ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {detail}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatYen(expense.amount)}
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
