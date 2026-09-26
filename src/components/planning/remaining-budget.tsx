import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatYen } from "@/lib/format";
import { monthlyProgress } from "@/lib/monthly-planning";
import { formatMonthParam, type MonthParam } from "@/lib/month";

export function RemainingBudget({
  month,
  budget,
  days,
}: {
  month: MonthParam;
  budget: number | null;
  days: { date: Date | string; total: number; items: { amount: number }[] }[];
}) {
  const progress = monthlyProgress(month, days, budget);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">生活費の残り予算</CardTitle>
        <CardDescription>
          日々の支出合計で計算します。固定費は含みません。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress.remaining === null ? (
          <p className="text-sm text-muted-foreground">
            生活費予算を設定すると、残額と1日あたりの目安が表示されます。
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {progress.remaining < 0 ? "予算超過" : "残り"}
                </p>
                <p
                  className={`text-3xl font-bold tabular-nums ${progress.remaining < 0 ? "text-rose-700" : "text-primary"}`}
                >
                  {formatYen(Math.abs(progress.remaining))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">1日あたりの目安</p>
                <p className="text-2xl font-bold">
                  {progress.dailyAllowance === null
                    ? "—"
                    : formatYen(progress.dailyAllowance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {progress.canClose
                    ? "終了した月です"
                    : `残り${progress.remainingDays}日（今月は今日を含む）`}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              予算 {formatYen(budget!)} − 記録済み支出{" "}
              {formatYen(progress.spent)}
              。未来の日付で登録した支出も差し引きます。
            </p>
          </>
        )}
        {progress.missingDates.length > 0 && (
          <p className="text-sm text-amber-800">
            未入力の日が{progress.missingDates.length}
            日あります。未入力の支出は残額に反映されていません。
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-primary">
          <Link href={`/budgets?month=${formatMonthParam(month)}`}>
            生活費予算を設定 →
          </Link>
          <Link href={`/monthly-review?month=${formatMonthParam(month)}`}>
            月締め・振り返り →
          </Link>
          <Link href="/wishlist">ほしいものリスト →</Link>
        </div>
      </CardContent>
    </Card>
  );
}
