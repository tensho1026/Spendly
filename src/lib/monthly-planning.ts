import { z } from "zod";
import { dateInputToUtc, jstParts, toDateInputValue } from "@/lib/format";
import {
  formatMonthParam,
  tryParseMonthParam,
  type MonthParam,
} from "@/lib/month";

export const MAX_MONEY = 2147483647;
const money = z
  .string()
  .trim()
  .regex(/^\d+$/, "金額は整数で入力してください")
  .transform(Number)
  .pipe(z.number().int().min(0).max(MAX_MONEY, "金額が上限を超えています"));
const month = z
  .string()
  .trim()
  .refine(
    (value) => tryParseMonthParam(value) !== null,
    "正しい月を指定してください",
  );
export const livingBudgetSchema = z.object({
  month,
  livingBudget: z
    .union([z.literal(""), money])
    .transform((value) => (value === "" ? null : value)),
});
export const reviewSchema = z.object({
  month,
  reflection: z
    .string()
    .trim()
    .max(3000, "振り返りは3000文字以内で入力してください"),
  intent: z.enum(["save", "close", "reopen"]),
  acknowledged: z.boolean(),
  fingerprint: z.string(),
});
export const wishSchema = z.object({
  id: z.string().trim(),
  name: z
    .string()
    .trim()
    .min(1, "名前を入力してください")
    .max(100, "名前は100文字以内で入力してください"),
  amount: money.refine((value) => value > 0, "1円以上で入力してください"),
  url: z
    .string()
    .trim()
    .max(2000, "URLは2000文字以内で入力してください")
    .refine((value) => {
      if (!value) return true;
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "http または https のURLを入力してください"),
  memo: z.string().trim().max(500, "メモは500文字以内で入力してください"),
});
export const purchaseSchema = z.object({
  id: z.string().trim().min(1),
  date: z
    .string()
    .refine(
      (value) => dateInputToUtc(value) !== null,
      "正しい購入日を入力してください",
    ),
  categoryId: z.string().trim().min(1, "カテゴリを選択してください"),
  amount: money.refine((value) => value > 0, "1円以上で入力してください"),
});

type Day = { date: Date | string; total: number; items: { amount: number }[] };
export function monthlyProgress(
  month: MonthParam,
  days: Day[],
  budget: number | null,
  now = new Date(),
) {
  const today = jstParts(now);
  const period = formatMonthParam(month);
  const current = formatMonthParam(today);
  const dayCount = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
  const elapsedDays =
    period < current ? dayCount : period === current ? today.day : 0;
  // Today's unspent allowance is included. Future-dated entries reserve budget too.
  const remainingDays =
    period < current
      ? 0
      : period === current
        ? dayCount - today.day + 1
        : dayCount;
  const recorded = new Set(days.map((day) => toDateInputValue(day.date)));
  const missingDates = Array.from(
    { length: elapsedDays },
    (_, index) => `${period}-${String(index + 1).padStart(2, "0")}`,
  ).filter((date) => !recorded.has(date));
  const spent = days.reduce((sum, day) => sum + day.total, 0);
  const remaining = budget === null ? null : budget - spent;
  return {
    spent,
    remaining,
    remainingDays,
    missingDates,
    dailyAllowance:
      remaining === null || remainingDays === 0
        ? null
        : Math.floor(Math.max(0, remaining) / remainingDays),
    mismatchedDays: days.filter(
      (day) =>
        day.total !== day.items.reduce((sum, item) => sum + item.amount, 0),
    ).length,
    canClose: period < current,
  };
}
