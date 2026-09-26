import Link from "next/link";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { InputCalendar } from "@/components/dashboard/input-calendar";
import { ReviewForm } from "@/components/planning/review-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ensureRecurringFixed } from "@/lib/ledger";
import { currentMonth, formatMonthParam, parseMonthParam } from "@/lib/month";
import { getMonthlyReview } from "@/lib/monthly-review";
import { formatDateJP, formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";
export default async function MonthlyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const month = parseMonthParam(
    Array.isArray(params.month) ? params.month[0] : params.month,
  );
  const period = formatMonthParam(month);
  await ensureRecurringFixed(period);
  const {
    plan,
    days,
    progress,
    fixedTotal,
    incomeTotal,
    fingerprint,
    changedSinceClose,
  } = await getMonthlyReview(month);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">月締め・振り返り</h1>
        <MonthSwitcher
          month={month}
          today={currentMonth()}
          basePath="/monthly-review"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        1か月のお金の流れを確認して、気づきを残しましょう。月締めは確認済みの印です。締めた後も記録を修正でき、変更があれば再確認をお知らせします。
      </p>
      {plan?.closedAt && (
        <p
          role="status"
          className={`rounded-xl border p-4 ${changedSinceClose ? "border-amber-300 bg-amber-50 text-amber-900" : "bg-secondary text-primary"}`}
        >
          {changedSinceClose
            ? "月締め後に記録や予算が変わっています。月締めを解除し、内容を確認してから再度締めてください。"
            : `${formatDateJP(plan.closedAt)}に月締め済みです。`}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "収入",
            value: incomeTotal,
            href: `/income?month=${period}`,
          },
          {
            label: "支出（日々＋固定費）",
            value: progress.spent + fixedTotal,
            href: `/expenses?month=${period}`,
          },
          {
            label: "収支",
            value: incomeTotal - progress.spent - fixedTotal,
            href: `/dashboard?month=${period}`,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatYen(stat.value)}</p>
              <Link
                className="mt-2 inline-block text-sm text-primary"
                href={stat.href}
              >
                記録を確認 →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">締める前の確認</CardTitle>
          <CardDescription>
            支出がない日も0円で記録すると、未入力と区別できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>未入力：{progress.missingDates.length}日</span>
            <span>合計と内訳に差額：{progress.mismatchedDays}日</span>
            <Link
              href={`/fixed-expenses?month=${period}`}
              className="text-primary"
            >
              固定費：{formatYen(fixedTotal)} →
            </Link>
          </div>
          <InputCalendar
            month={month}
            days={days.map((day) => ({
              id: day.id,
              date: day.date,
              total: day.total,
              itemTotal: day.items.reduce((sum, item) => sum + item.amount, 0),
            }))}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">振り返りメモ</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm
            key={period}
            month={period}
            reflection={plan?.reflection ?? ""}
            closed={!!plan?.closedAt}
            canClose={progress.canClose}
            fingerprint={fingerprint}
          />
        </CardContent>
      </Card>
    </div>
  );
}
