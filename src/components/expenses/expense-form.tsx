"use client";

import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import {
  createExpenseAction,
  updateExpenseAction,
} from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/action-state";
import { formatYen, toDateInputValue } from "@/lib/format";
import type { CategoryWithSub, ExpenseWithRelations } from "@/lib/queries";

export type ExpenseFormProps = {
  categories: CategoryWithSub[];
  mode: "create" | "edit";
  expense?: ExpenseWithRelations;
};

/** 全角数字を半角に直し、数字以外を取り除く。 */
function normalizeAmountInput(value: string): string {
  return value
    .replace(/[０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0),
    )
    .replace(/[^0-9]/g, "");
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-destructive">
      {messages.join(" / ")}
    </p>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          保存中...
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export function ExpenseForm({ categories, mode, expense }: ExpenseFormProps) {
  const [state, formAction] = useActionState(
    mode === "create" ? createExpenseAction : updateExpenseAction,
    initialActionState,
  );
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(
    expense?.subcategoryId ?? "",
  );
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [merchant, setMerchant] = useState(expense?.merchant ?? "");
  const [memo, setMemo] = useState(expense?.memo ?? "");
  const [date, setDate] = useState(
    toDateInputValue(expense?.date ?? new Date()),
  );

  if (categories.length === 0) {
    return (
      <EmptyState
        title="先にカテゴリを作成してください"
        description="支出を登録するには、大カテゴリが 1 つ以上必要です。"
        action={
          <Button asChild>
            <Link href="/settings/categories">カテゴリを設定する</Link>
          </Button>
        }
      />
    );
  }

  const subcategories =
    categories.find((category) => category.id === categoryId)?.subcategories ??
    [];
  const cancelHref =
    mode === "edit" && expense ? `/expenses/${expense.id}` : "/expenses";
  const fieldErrors = state.fieldErrors;
  const amountPreview = amount === "" ? null : formatYen(Number(amount));

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    setCategoryId(event.target.value);
    setSubcategoryId("");
  }

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && expense ? (
        <input type="hidden" name="id" value={expense.id} />
      ) : null}

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">
            金額 <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              ¥
            </span>
            <Input
              id="amount"
              name="amount"
              className="pl-7 tabular-nums"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              required
              value={amount}
              onChange={(event) =>
                setAmount(normalizeAmountInput(event.target.value))
              }
              aria-invalid={Boolean(fieldErrors?.amount)}
              aria-describedby={
                fieldErrors?.amount ? "amount-error" : undefined
              }
            />
          </div>
          {fieldErrors?.amount ? (
            <FieldError id="amount-error" messages={fieldErrors.amount} />
          ) : amountPreview ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              {amountPreview}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">
            日付 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={Boolean(fieldErrors?.date)}
            aria-describedby={fieldErrors?.date ? "date-error" : undefined}
          />
          <FieldError id="date-error" messages={fieldErrors?.date} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">
            大カテゴリ <span className="text-destructive">*</span>
          </Label>
          <NativeSelect
            id="categoryId"
            name="categoryId"
            required
            value={categoryId}
            onChange={handleCategoryChange}
            aria-invalid={Boolean(fieldErrors?.categoryId)}
            aria-describedby={
              fieldErrors?.categoryId ? "categoryId-error" : undefined
            }
          >
            <option value="">カテゴリを選択</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
          <FieldError
            id="categoryId-error"
            messages={fieldErrors?.categoryId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategoryId">詳細カテゴリ</Label>
          <NativeSelect
            id="subcategoryId"
            name="subcategoryId"
            value={subcategoryId}
            disabled={subcategories.length === 0}
            onChange={(event) => setSubcategoryId(event.target.value)}
            aria-invalid={Boolean(fieldErrors?.subcategoryId)}
            aria-describedby={
              fieldErrors?.subcategoryId ? "subcategoryId-error" : undefined
            }
          >
            {subcategories.length === 0 ? (
              <option value="">
                {categoryId === ""
                  ? "先に大カテゴリを選択"
                  : "詳細カテゴリなし"}
              </option>
            ) : (
              <>
                <option value="">指定なし</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </>
            )}
          </NativeSelect>
          <FieldError
            id="subcategoryId-error"
            messages={fieldErrors?.subcategoryId}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="merchant">支出先</Label>
          <Input
            id="merchant"
            name="merchant"
            placeholder="例: セブンイレブン"
            autoComplete="off"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            maxLength={100}
            aria-invalid={Boolean(fieldErrors?.merchant)}
            aria-describedby={
              fieldErrors?.merchant ? "merchant-error" : undefined
            }
          />
          <FieldError id="merchant-error" messages={fieldErrors?.merchant} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="memo">メモ</Label>
          <Textarea
            id="memo"
            name="memo"
            rows={3}
            placeholder="例: 昼飯"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            maxLength={500}
            aria-invalid={Boolean(fieldErrors?.memo)}
            aria-describedby={fieldErrors?.memo ? "memo-error" : undefined}
          />
          <FieldError id="memo-error" messages={fieldErrors?.memo} />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={cancelHref}>キャンセル</Link>
        </Button>
        <SubmitButton label={mode === "create" ? "支出を登録" : "変更を保存"} />
      </div>
    </form>
  );
}
