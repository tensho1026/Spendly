import { z } from "zod";
import { dateInputToUtc } from "@/lib/format";
import { tryParseMonthParam } from "@/lib/month";

const money = (minimum: number) =>
  z
    .union([z.string().trim().min(1, "金額を入力してください"), z.number()])
    .pipe(
      z.coerce
        .number<string | number>()
        .int("金額は整数で入力してください")
        .min(minimum, `${minimum}円以上で入力してください`)
        .max(2147483647, "金額が上限を超えています"),
    );
export const ledgerItemSchema = z.object({
  categoryId: z.string().trim().min(1, "カテゴリを選択してください"),
  amount: money(1),
  memo: z
    .string()
    .trim()
    .max(500, "メモは500文字以内で入力してください")
    .transform((value) => value || null),
});
const itemsSchema = z
  .array(ledgerItemSchema)
  .max(100, "内訳は100行以内で入力してください");
export const dailySchema = z.object({
  id: z.string().optional(),
  date: z
    .string()
    .refine(
      (value) => dateInputToUtc(value) !== null,
      "正しい日付を入力してください",
    ),
  total: money(0),
  items: itemsSchema,
});
export const fixedSchema = z.object({
  month: z
    .string()
    .refine(
      (value) => tryParseMonthParam(value) !== null,
      "正しい月を指定してください",
    ),
  items: z.array(ledgerItemSchema.extend({
    dueDay: z.union([z.literal(""), z.coerce.number().int().min(1, "支払日は1〜31日で入力してください").max(31, "支払日は1〜31日で入力してください")]).optional().transform((value) => value === "" || value === undefined ? null : value),
  })).max(100, "内訳は100行以内で入力してください"),
});
export const budgetSchema = z.object({
  month: z.string().refine((value) => tryParseMonthParam(value) !== null, "正しい月を指定してください"),
  budgets: z.array(z.object({
    categoryId: z.string().trim().min(1, "カテゴリを選択してください"),
    amount: money(0),
  })).max(100, "予算は100件以内で入力してください"),
});
export const templateSchema = ledgerItemSchema.extend({
  id: z.string().optional(),
});
export const incomeSchema = z.object({
  id: z.string().optional(),
  date: z.string().refine((value) => dateInputToUtc(value) !== null, "正しい日付を入力してください"),
  type: z.enum(["salary", "bonus", "extra"]),
  amount: money(1),
  memo: z.string().trim().max(500, "メモは500文字以内で入力してください").transform((value) => value || null),
});
export const recurringFixedSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().trim().min(1, "カテゴリを選択してください"),
  amount: money(1),
  memo: z.string().trim().max(500, "メモは500文字以内で入力してください").transform((value) => value || null),
  dueDay: z.coerce.number().int().min(1, "支払日は1〜31日で入力してください").max(31, "支払日は1〜31日で入力してください"),
  startMonth: z.string().refine((value) => tryParseMonthParam(value) !== null, "正しい開始月を指定してください"),
  active: z.coerce.boolean(),
});

export function parseItems(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function sumItems(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function differenceLabel(difference: number): string {
  return difference < 0
    ? "内訳が合計を超えています"
    : difference > 0
      ? "まだ内訳を入力していない金額"
      : "合計と内訳が一致しています";
}
