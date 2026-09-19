import { formatYen } from "@/lib/format";

type SubcategoryDatum = {
  subcategoryId: string | null;
  name: string;
  total: number;
};

type SubcategoryBreakdownProps = {
  categoryName: string;
  categoryTotal: number;
  data: SubcategoryDatum[];
};

function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "0%";
  return ratio < 10 ? `${ratio.toFixed(1)}%` : `${Math.round(ratio)}%`;
}

export function SubcategoryBreakdown({
  categoryName,
  categoryTotal,
  data,
}: SubcategoryBreakdownProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 border-b pb-2">
        <h3 className="truncate text-sm font-semibold">{categoryName}</h3>
        <span className="shrink-0 text-base font-bold tabular-nums">
          {formatYen(categoryTotal)}
        </span>
      </div>

      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          このカテゴリの支出はこの月にはありません
        </p>
      ) : (
        <ul className="space-y-1">
          {data.map((item) => {
            const label = item.subcategoryId === null ? "未分類" : item.name;
            const ratio =
              categoryTotal > 0 ? (item.total / categoryTotal) * 100 : 0;

            return (
              <li
                key={item.subcategoryId ?? "uncategorized"}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm odd:bg-muted/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className="text-muted-foreground">
                    ・
                  </span>
                  <span className="truncate">{label}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatPercent(ratio)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatYen(item.total)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
