"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { formatYen } from "@/lib/format";
import type { CategoryWithSub } from "@/lib/queries";
import { cn } from "@/lib/utils";

const FILTER_KEYS = [
  "month",
  "from",
  "to",
  "minAmount",
  "maxAmount",
  "categoryId",
  "subcategoryId",
  "merchant",
  "keyword",
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

const FILTER_LABELS: Record<FilterKey, string> = {
  month: "月",
  from: "開始日",
  to: "終了日",
  minAmount: "最小金額",
  maxAmount: "最大金額",
  categoryId: "大カテゴリ",
  subcategoryId: "詳細カテゴリ",
  merchant: "支出先",
  keyword: "キーワード",
};

export type ExpenseFilterValues = Partial<Record<FilterKey, string>>;

export type ExpenseFiltersProps = {
  categories: CategoryWithSub[];
  values: ExpenseFilterValues;
};

function buildHref(values: ExpenseFilterValues, omitKey?: FilterKey): string {
  const params = new URLSearchParams();

  for (const key of FILTER_KEYS) {
    if (key === omitKey) {
      continue;
    }
    const value = values[key]?.trim();
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/expenses?${query}` : "/expenses";
}

function formatAmountChip(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? formatYen(parsed) : value;
}

export function ExpenseFilters({ categories, values }: ExpenseFiltersProps) {
  const router = useRouter();
  const subcategoriesById = new Map(
    categories.flatMap((category) =>
      category.subcategories.map((sub) => [sub.id, sub.name] as const),
    ),
  );

  const chips = FILTER_KEYS.flatMap((key) => {
    const value = values[key]?.trim();
    if (!value) {
      return [];
    }

    let display = value;
    if (key === "categoryId") {
      display =
        categories.find((category) => category.id === value)?.name ?? value;
    } else if (key === "subcategoryId") {
      display = subcategoriesById.get(value) ?? value;
    } else if (key === "minAmount" || key === "maxAmount") {
      display = formatAmountChip(value);
    }

    return [{ key, label: FILTER_LABELS[key], display }];
  });

  const [open, setOpen] = useState(chips.length > 0);
  const [categoryId, setCategoryId] = useState(values.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(
    values.subcategoryId ?? "",
  );

  const subcategories =
    categories.find((category) => category.id === categoryId)?.subcategories ??
    [];

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    setCategoryId(event.target.value);
    setSubcategoryId("");
  }

  // 空欄の項目を URL に残さないよう、送信内容から取り除いてから遷移する。
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of FILTER_KEYS) {
      const raw = formData.get(key);
      const value = typeof raw === "string" ? raw.trim() : "";
      if (value) {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.push(query ? `/expenses?${query}` : "/expenses");
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          絞り込み
          {chips.length > 0 ? (
            <Badge variant="secondary">{chips.length}</Badge>
          ) : null}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        {chips.length > 0 ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/expenses">条件をクリア</Link>
          </Button>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t px-3 py-2">
          {chips.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="gap-1">
              <span className="max-w-40 truncate">
                {chip.label}: {chip.display}
              </span>
              <Link
                href={buildHref(values, chip.key)}
                aria-label={`${chip.label}の条件を外す`}
                className="rounded-full hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </Link>
            </Badge>
          ))}
        </div>
      ) : null}

      {open ? (
        <form
          method="get"
          action="/expenses"
          onSubmit={handleSubmit}
          className="space-y-4 border-t p-3 sm:p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="filter-month">月</Label>
              <Input
                id="filter-month"
                name="month"
                type="month"
                defaultValue={values.month ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-from">開始日</Label>
              <Input
                id="filter-from"
                name="from"
                type="date"
                defaultValue={values.from ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-to">終了日</Label>
              <Input
                id="filter-to"
                name="to"
                type="date"
                defaultValue={values.to ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-min-amount">最小金額</Label>
              <Input
                id="filter-min-amount"
                name="minAmount"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                defaultValue={values.minAmount ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-max-amount">最大金額</Label>
              <Input
                id="filter-max-amount"
                name="maxAmount"
                inputMode="numeric"
                autoComplete="off"
                placeholder="上限なし"
                defaultValue={values.maxAmount ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-category">大カテゴリ</Label>
              <NativeSelect
                id="filter-category"
                name="categoryId"
                value={categoryId}
                onChange={handleCategoryChange}
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
              <Label htmlFor="filter-subcategory">詳細カテゴリ</Label>
              <NativeSelect
                id="filter-subcategory"
                name="subcategoryId"
                value={subcategoryId}
                disabled={subcategories.length === 0}
                onChange={(event) => setSubcategoryId(event.target.value)}
              >
                {subcategories.length === 0 ? (
                  <option value="">
                    {categoryId === ""
                      ? "先に大カテゴリを選択"
                      : "詳細カテゴリなし"}
                  </option>
                ) : (
                  <>
                    <option value="">すべて</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </>
                )}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-merchant">支出先</Label>
              <Input
                id="filter-merchant"
                name="merchant"
                autoComplete="off"
                placeholder="例: セブンイレブン"
                defaultValue={values.merchant ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-keyword">キーワード</Label>
              <Input
                id="filter-keyword"
                name="keyword"
                autoComplete="off"
                placeholder="支出先・メモを検索"
                defaultValue={values.keyword ?? ""}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            期間は「月」または「開始日・終了日」で指定できます。
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/expenses">条件をクリア</Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              <Search className="size-4" aria-hidden="true" />
              検索
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
