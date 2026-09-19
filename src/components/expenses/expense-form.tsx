"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { saveDailyAction, saveFixedAction } from "@/app/actions/expenses";
import { initialActionState } from "@/lib/action-state";
import { differenceLabel } from "@/lib/ledger-validation";
import { formatYen } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type Item = { categoryId: string; amount: number; memo: string | null };
type Row = { key: number; categoryId: string; amount: string; memo: string };
type Props = {
  mode: "daily" | "fixed";
  categories: { id: string; name: string }[];
  period: string;
  record?: { id: string; total: number; items: Item[] };
  items?: Item[];
  templates?: (Item & { id: string; category: { name: string } })[];
};
const normalize = (value: string) =>
  value
    .replace(/[０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0),
    )
    .replace(/[^0-9]/g, "");

export function ExpenseForm({
  mode,
  categories,
  period,
  record,
  items = [],
  templates = [],
}: Props) {
  const [state, action, pending] = useActionState(
    mode === "daily" ? saveDailyAction : saveFixedAction,
    initialActionState,
  );
  const [date, setDate] = useState(period);
  const [total, setTotal] = useState(record ? String(record.total) : "");
  const [rows, setRows] = useState<Row[]>(() =>
    (record?.items ?? items).map((item, index) => ({
      key: index,
      categoryId: item.categoryId,
      amount: String(item.amount),
      memo: item.memo ?? "",
    })),
  );
  const [nextKey, setNextKey] = useState(rows.length);
  const [changed, setChanged] = useState(false);
  const itemTotal = rows.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  );
  const difference = (Number(total) || 0) - itemTotal;
  function changeRow(
    key: number,
    field: "categoryId" | "amount" | "memo",
    value: string,
  ) {
    setChanged(true);
    setRows((previous) =>
      previous.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    );
  }
  function addItem(item?: Item) {
    setRows((previous) => [...previous, { key: nextKey, categoryId: item?.categoryId ?? "", amount: item ? String(item.amount) : "", memo: item?.memo ?? "" }]);
    setNextKey((value) => value + 1);
    setChanged(true);
  }
  return (
    <form
      action={(form) => {
        setChanged(false);
        action(form);
      }}
      className="space-y-6"
    >
      <input type="hidden" name="id" value={record?.id ?? ""} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          rows.map(({ categoryId, amount, memo }) => ({
            categoryId,
            amount,
            memo,
          })),
        )}
      />
      {mode === "fixed" && <input type="hidden" name="month" value={period} />}
      {state.message && (!state.ok || !changed) && (
        <p
          role="status"
          className={`rounded-lg border p-3 text-sm ${state.ok ? "bg-secondary text-primary" : "border-destructive/30 bg-destructive/5 text-destructive"}`}
        >
          {state.message}
        </p>
      )}
      <fieldset disabled={pending} className="space-y-6 disabled:opacity-70">
        {mode === "daily" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                name="date"
                required
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setChanged(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">1日の出費合計（円）</Label>
              <Input
                id="total"
                name="total"
                inputMode="numeric"
                required
                placeholder="例: 5000"
                value={total}
                onChange={(event) => {
                  setTotal(normalize(event.target.value));
                  setChanged(true);
                }}
                className="font-semibold tabular-nums"
              />
              <p className="text-xs text-muted-foreground">
                内訳がまだ揃っていなくても保存できます。支出がない日は0円で記録できます。
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-secondary p-5">
            <p className="text-sm text-secondary-foreground">
              この月の固定費合計
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {formatYen(itemTotal)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              日々の支出には含めず、月の支出に一度だけ加算します。
            </p>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              {mode === "daily" ? "この日の内訳" : "固定費の内訳"}
            </h2>
            <span className="text-xs text-muted-foreground">
              カテゴリ・金額・メモ
            </span>
          </div>
          {mode === "daily" && templates.length > 0 && (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="mb-3 text-xs font-semibold text-muted-foreground">よく使う内訳から追加</p>
              <div className="flex flex-wrap gap-2">{templates.map((template) => <Button key={template.id} type="button" variant="outline" size="sm" onClick={() => addItem(template)} disabled={rows.length >= 100}>{template.memo || template.category.name} · {formatYen(template.amount)}</Button>)}</div>
            </div>
          )}
          {rows.length === 0 && (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              {mode === "daily"
                ? "合計だけ先に記録することもできます。"
                : "家賃やサブスクなど、この月の固定費を追加しましょう。"}
            </p>
          )}
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="space-y-3 rounded-xl border bg-background/50 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {index + 1}件目
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`${index + 1}行目を削除`}
                  onClick={() => {
                    setRows(rows.filter((item) => item.key !== row.key));
                    setChanged(true);
                  }}
                >
                  <Trash2 className="size-4" />
                  削除
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`category-${row.key}`}>カテゴリ</Label>
                  <NativeSelect
                    id={`category-${row.key}`}
                    aria-label={`${index + 1}行目のカテゴリ`}
                    required
                    value={row.categoryId}
                    onChange={(event) =>
                      changeRow(row.key, "categoryId", event.target.value)
                    }
                  >
                    <option value="">カテゴリを選択</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`amount-${row.key}`}>金額（円）</Label>
                  <Input
                    id={`amount-${row.key}`}
                    aria-label={`${index + 1}行目の金額`}
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={row.amount}
                    onChange={(event) =>
                      changeRow(
                        row.key,
                        "amount",
                        normalize(event.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`memo-${row.key}`}>
                  メモ{" "}
                  <span className="text-xs text-muted-foreground">任意</span>
                </Label>
                <Textarea
                  id={`memo-${row.key}`}
                  aria-label={`${index + 1}行目のメモ`}
                  rows={2}
                  maxLength={500}
                  placeholder={
                    mode === "daily"
                      ? "例: 昼ごはん、週末の買い出し"
                      : "例: 家賃、音楽サブスク"
                  }
                  value={row.memo}
                  onChange={(event) =>
                    changeRow(row.key, "memo", event.target.value)
                  }
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            disabled={categories.length === 0 || rows.length >= 100}
            onClick={() => {
              addItem();
            }}
          >
            <Plus className="size-4" />
            内訳を追加
          </Button>
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              内訳の入力には
              <Link
                href="/settings/categories"
                className="text-primary underline"
              >
                カテゴリの作成
              </Link>
              が必要です。
            </p>
          )}
        </div>
        {mode === "daily" && (
          <div
            aria-live="polite"
            className="space-y-3 rounded-xl bg-secondary/60 p-4"
          >
            <div className="flex justify-between text-sm">
              <span>内訳の合計</span>
              <span className="font-semibold tabular-nums">
                {formatYen(itemTotal)}
              </span>
            </div>
            {total !== "" && (
              <div className="flex flex-wrap justify-between gap-2 border-t pt-3 text-sm">
                <span>{differenceLabel(difference)}</span>
                <span className="font-semibold tabular-nums">
                  {formatYen(Math.abs(difference))}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              月の集計には「1日の出費合計」を使います。差額は後から修正できます。
            </p>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {mode === "daily" && (
            <Button asChild variant="outline">
              <Link href={record ? `/expenses/${record.id}` : "/expenses"}>
                キャンセル
              </Link>
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            <Save className="size-4" />
            {pending
              ? "保存中..."
              : mode === "daily"
                ? "1日分を保存"
                : "この月の固定費を保存"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
