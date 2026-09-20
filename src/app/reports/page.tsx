import Link from "next/link";

import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import {
  AnnualCashflowChart,
  WeeklyCashflowChart,
} from "@/components/reports/report-charts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatYen } from "@/lib/format";
import { currentMonth, parseMonthParam } from "@/lib/month";
import { getAnnualReport, getWeeklyReport } from "@/lib/reports";
import { colorClass } from "@/lib/tags";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function ReportTabs({ view }: { view: "annual" | "weekly" }) {
  return (
    <div className="flex rounded-lg bg-muted p-1">
      <Button
        asChild
        size="sm"
        variant={view === "annual" ? "secondary" : "ghost"}
      >
        <Link href="/reports?view=annual">年間</Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant={view === "weekly" ? "secondary" : "ghost"}
      >
        <Link href="/reports?view=weekly">週間</Link>
      </Button>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view = first(params.view) === "weekly" ? "weekly" : "annual";

  if (view === "weekly") {
    return <WeeklyReport date={first(params.date)} />;
  }

  const month = parseMonthParam(first(params.month));
  const report = await getAnnualReport(month);
  const yoy = report.yoy;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">年間レポート</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            選択月までの12か月を、専用画面で振り返ります。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportTabs view="annual" />
          <MonthSwitcher
            month={month}
            today={currentMonth()}
            basePath="/reports"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="月平均の収入" value={report.averageIncome} />
        <Stat label="月平均の支出" value={report.averageExpense} />
        <Stat
          label="支出が最大の月"
          value={report.highest.expense}
          note={report.highest.period}
        />
        <Stat label="前年同月との支出差" value={yoy.expense} signed />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>過去12か月の収入・支出・収支</CardTitle>
          <CardDescription>
            前年同月比：収入 {signedYen(yoy.income)} / 支出{" "}
            {signedYen(yoy.expense)} / 収支 {signedYen(yoy.balance)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnnualCashflowChart data={report.rows} />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">カテゴリの月平均</CardTitle>
          </CardHeader>
          <CardContent>
            {report.categories.length ? (
              <ul className="divide-y">
                {report.categories.map((category) => (
                  <li
                    key={category.name}
                    className="flex justify-between py-3"
                  >
                    <span>{category.name}</span>
                    <span>
                      <strong>{formatYen(category.average)}</strong>
                      <small className="ml-2 text-muted-foreground">
                        年計 {formatYen(category.total)}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                集計できる内訳がありません。
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">タグ別の支出</CardTitle>
            <CardDescription>
              複数タグが付いた内訳は、それぞれのタグへ集計されます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {report.tags.map((tag) => (
                  <span
                    key={tag.name}
                    className={`rounded-full border px-3 py-2 text-sm ${colorClass(tag.color)}`}
                  >
                    #{tag.name} <strong>{formatYen(tag.total)}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                タグ付きの支出はありません。
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function WeeklyReport({ date }: { date?: string }) {
  const report = await getWeeklyReport(date);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">週間レポート</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            1週間の収入と日々の支出を確認します。
          </p>
        </div>
        <ReportTabs view="weekly" />
      </div>
      <form className="flex max-w-sm items-end gap-2">
        <input type="hidden" name="view" value="weekly" />
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium">
            週に含まれる日
          </label>
          <Input id="date" name="date" type="date" defaultValue={date} />
        </div>
        <Button>表示</Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="収入" value={report.income} />
        <Stat label="支出" value={report.expense} />
        <Stat label="収支" value={report.income - report.expense} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {report.start}〜{report.end}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyCashflowChart data={report.rows} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">カテゴリ別の内訳</CardTitle>
        </CardHeader>
        <CardContent>
          {report.categories.length ? (
            <ul className="divide-y">
              {report.categories.map((category) => (
                <li
                  key={category.name}
                  className="flex justify-between py-3"
                >
                  <span>{category.name}</span>
                  <strong>{formatYen(category.total)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              この週の内訳はありません。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  signed,
}: {
  label: string;
  value: number;
  note?: string;
  signed?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">
          {signed ? signedYen(value) : formatYen(value)}
        </p>
        {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

function signedYen(value: number) {
  return value === 0
    ? "±¥0"
    : `${value > 0 ? "+" : "-"}${formatYen(Math.abs(value))}`;
}
