import Link from "next/link";

import { formatYen } from "@/lib/format";
import { cn } from "@/lib/utils";
import { colorForIndex } from "./chart-colors";

type CategoryDatum = {
  categoryId: string;
  name: string;
  total: number;
};

type CategoryBreakdownProps = {
  data: CategoryDatum[];
  total: number;
  selectedCategoryId?: string;
  /** "YYYY-MM" 形式の対象月。リンクのクエリに使う。 */
  month: string;
  basePath?: string;
};

/** 構成比の表示（10% 未満は小数第1位まで）。 */
function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "0%";
  return ratio < 10 ? `${ratio.toFixed(1)}%` : `${Math.round(ratio)}%`;
}

export function CategoryBreakdown({
  data,
  total,
  selectedCategoryId,
  month,
  basePath = "/dashboard",
}: CategoryBreakdownProps) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        この月の支出はまだありません
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {data.map((item, index) => {
        const isSelected = item.categoryId === selectedCategoryId;
        const ratio = total > 0 ? (item.total / total) * 100 : 0;
        const color = colorForIndex(index);
        const href = isSelected
          ? `${basePath}?month=${encodeURIComponent(month)}`
          : `${basePath}?month=${encodeURIComponent(month)}&category=${encodeURIComponent(item.categoryId)}`;

        return (
          <li key={item.categoryId}>
            <Link
              href={href}
              scroll={false}
              aria-current={isSelected ? "true" : undefined}
              title={
                isSelected
                  ? `${item.name}の選択を解除`
                  : `${item.name}の内訳を見る`
              }
              className={cn(
                "block rounded-lg border border-transparent px-3 py-2 transition-colors hover:bg-accent",
                isSelected && "border-border bg-accent",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-sm font-medium">
                    {item.name}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatYen(item.total)}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.min(ratio, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {formatPercent(ratio)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
