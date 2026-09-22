import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDateJP, formatYen } from "@/lib/format";
import { sumItems } from "@/lib/ledger-validation";

type DailyListDay = {
  id: string;
  date: Date | string;
  total: number;
  items: { amount: number; category: { name: string } }[];
};

export function DailyList({ days }: { days: DailyListDay[] }) {
  if (!days.length)
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">日々の支出はまだありません</p>
        <p className="mt-2 text-sm text-muted-foreground">
          条件に合う記録がないか、この期間は未入力です。
        </p>
        <Link
          href="/expenses/new"
          className="mt-4 inline-block text-sm font-semibold text-primary"
        >
          1日分を記録する →
        </Link>
      </div>
    );
  return (
    <div className="space-y-3">
      {days.map((day) => {
        const difference = day.total - sumItems(day.items);
        return (
          <Link
            key={day.id}
            href={`/expenses/${day.id}`}
            className="flex items-center gap-3 rounded-xl border bg-card p-5 transition-colors hover:bg-accent"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{formatDateJP(day.date)}</h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {day.items.length}件の内訳
                {day.items.length > 0 &&
                  ` · ${[...new Set(day.items.map((item) => item.category.name))].join("・")}`}
              </p>
              {difference !== 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  {difference > 0 ? "内訳未入力" : "内訳が合計を超過"}:{" "}
                  {formatYen(Math.abs(difference))}
                </p>
              )}
            </div>
            <span className="shrink-0 text-lg font-bold tabular-nums">
              {formatYen(day.total)}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}
