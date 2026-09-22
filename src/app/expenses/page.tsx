import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { DailyList } from "@/components/expenses/daily-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { getDaysPage, getTags } from "@/lib/ledger";
import { getCategoriesWithSub } from "@/lib/queries";
import { formatYen } from "@/lib/format";
import { tryParseMonthParam } from "@/lib/month";
export const dynamic = "force-dynamic";

function parsePage(value: string) {
  const page = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(page) && page >= 1 && page <= 10000
    ? page
    : 1;
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const month = first(params.month),
    categoryId = first(params.categoryId),
    keyword = first(params.keyword),
    tagId = first(params.tagId);
  const page = parsePage(first(params.page));
  const [result, categories, tags] = await Promise.all([
    getDaysPage(tryParseMonthParam(month) ?? undefined, { categoryId, keyword, tagId }, page),
    getCategoriesWithSub(),
    getTags(),
  ]);
  const pageHref = (number: number) => {
    const query = new URLSearchParams();
    if (month) query.set("month", month);
    if (tagId) query.set("tagId", tagId);
    if (categoryId) query.set("categoryId", categoryId);
    if (keyword) query.set("keyword", keyword);
    if (number > 1) query.set("page", String(number));
    const value = query.toString();
    return value ? `/expenses?${value}` : "/expenses";
  };
  if (page > result.totalPages) redirect(pageHref(result.totalPages));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">日々の支出</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.count}日分 / 日別合計の合計 {formatYen(result.total)}
          </p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="size-4" />
            1日分を記録
          </Link>
        </Button>
      </div>
      <form
        action="/expenses"
        className="grid items-end gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-2">
          <Label htmlFor="month">月</Label>
          <Input
            key={month}
            id="month"
            type="month"
            name="month"
            defaultValue={month}
          />
        </div>
        <div className="space-y-2"><Label htmlFor="tagId">タグ</Label><NativeSelect key={tagId} id="tagId" name="tagId" defaultValue={tagId}><option value="">すべて</option>{tags.map((tag)=><option key={tag.id} value={tag.id}>#{tag.name}</option>)}</NativeSelect></div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">カテゴリ</Label>
          <NativeSelect
            key={categoryId}
            id="categoryId"
            name="categoryId"
            defaultValue={categoryId}
          >
            <option value="">すべて</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="keyword">メモを検索</Label>
          <Input
            key={keyword}
            id="keyword"
            name="keyword"
            defaultValue={keyword}
            placeholder="例: 昼ごはん"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">
            <Search className="size-4" />
            検索
          </Button>
          <Button asChild variant="ghost">
            <Link href="/expenses">クリア</Link>
          </Button>
        </div>
      </form>
      {(categoryId || keyword || tagId) && (
        <p className="text-xs text-muted-foreground">
          一致する内訳を含む日を表示しています。金額は、その日全体の合計です。
        </p>
      )}
      <DailyList days={result.days} />
      {result.totalPages > 1 && (
        <nav aria-label="支出一覧のページ" className="flex items-center justify-between gap-3 text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className="font-medium text-primary">← 前のページ</Link> : <span />}
          <span>{page} / {result.totalPages} ページ</span>
          {page < result.totalPages ? <Link href={pageHref(page + 1)} className="font-medium text-primary">次のページ →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
