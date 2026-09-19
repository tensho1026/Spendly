import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { DailyList } from "@/components/expenses/daily-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { getDays, getTags } from "@/lib/ledger";
import { getCategoriesWithSub } from "@/lib/queries";
import { formatYen } from "@/lib/format";
import { tryParseMonthParam } from "@/lib/month";
export const dynamic = "force-dynamic";
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
  const [days, categories, tags] = await Promise.all([
    getDays(tryParseMonthParam(month) ?? undefined, { categoryId, keyword, tagId }),
    getCategoriesWithSub(),
    getTags(),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">日々の支出</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {days.length}日分 / 日別合計の合計{" "}
            {formatYen(days.reduce((sum, day) => sum + day.total, 0))}
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
      <DailyList days={days} />
    </div>
  );
}
