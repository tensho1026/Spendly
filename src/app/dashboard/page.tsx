import Link from "next/link";
import { Plus, Tags } from "lucide-react";

import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { SubcategoryBreakdown } from "@/components/dashboard/subcategory-breakdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMonthJP, formatYen } from "@/lib/format";
import { currentMonth, formatMonthParam, parseMonthParam } from "@/lib/month";
import {
  getCategoriesWithSub,
  getCategoryBreakdown,
  getMonthlyTotal,
  getRecentExpenses,
  getSubcategoryBreakdown,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 同じキーが複数回来た場合は最初の値を使い、空文字は未指定として扱う。 */
function firstValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;

  const month = parseMonthParam(firstValue(resolvedSearchParams.month));
  const monthParam = formatMonthParam(month);
  const requestedCategoryId = firstValue(resolvedSearchParams.category);

  const [total, breakdown, recentExpenses, categories, subcategoryBreakdown] =
    await Promise.all([
      getMonthlyTotal(month),
      getCategoryBreakdown(month),
      getRecentExpenses(month),
      getCategoriesWithSub(),
      requestedCategoryId
        ? getSubcategoryBreakdown(month, requestedCategoryId)
        : Promise.resolve(null),
    ]);

  // 存在しないカテゴリ ID が URL に入っていた場合は未選択として扱う。
  const selectedCategory = requestedCategoryId
    ? categories.find((category) => category.id === requestedCategoryId)
    : undefined;
  const selectedCategoryTotal =
    breakdown.find((item) => item.categoryId === selectedCategory?.id)?.total ??
    0;

  const today = currentMonth();
  const isCurrentMonth =
    today.year === month.year && today.month === month.month;
  const hasCategories = categories.length > 0;
  const hasExpenses = breakdown.length > 0 || recentExpenses.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <MonthSwitcher month={month} today={today} />
          <Button asChild size="sm">
            <Link href="/expenses/new">
              <Plus className="size-4" aria-hidden="true" />
              支出を追加
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>
            {formatMonthJP(month.year, month.month)}
          </CardDescription>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {isCurrentMonth ? "今月の支出" : "この月の支出"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums sm:text-4xl">
            {formatYen(total)}
          </p>
        </CardContent>
      </Card>

      {hasCategories && hasExpenses ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">カテゴリ別の割合</CardTitle>
                <CardDescription>
                  円グラフと棒グラフを切り替えられます。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryChart
                  data={breakdown}
                  selectedCategoryId={selectedCategory?.id}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">カテゴリ別の内訳</CardTitle>
                <CardDescription>
                  カテゴリを選ぶと詳細カテゴリの内訳を表示します。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBreakdown
                  data={breakdown}
                  total={total}
                  selectedCategoryId={selectedCategory?.id}
                  month={monthParam}
                />
              </CardContent>
            </Card>
          </div>

          {selectedCategory && subcategoryBreakdown ? (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    詳細カテゴリの内訳
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/dashboard?month=${encodeURIComponent(monthParam)}`}
                      scroll={false}
                    >
                      選択を解除
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SubcategoryBreakdown
                  categoryName={selectedCategory.name}
                  categoryTotal={selectedCategoryTotal}
                  data={subcategoryBreakdown}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近の支出</CardTitle>
              <CardDescription>
                {formatMonthJP(month.year, month.month)}の直近の記録です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentExpenses expenses={recentExpenses} />
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          title="まずは支出を登録しましょう"
          description={
            hasCategories
              ? `${formatMonthJP(month.year, month.month)}の支出はまだありません。支出を登録すると、カテゴリ別の内訳がここに表示されます。`
              : "カテゴリがまだありません。カテゴリを用意してから支出を登録すると、内訳がここに表示されます。"
          }
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/expenses/new">
                  <Plus className="size-4" aria-hidden="true" />
                  支出を追加
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/settings/categories">
                  <Tags className="size-4" aria-hidden="true" />
                  カテゴリを設定
                </Link>
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
}
