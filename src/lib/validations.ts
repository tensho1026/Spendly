import { z } from "zod";

/** FormData の値（string | File | null）を必ず trim 済みの文字列にする。 */
function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** 空文字・未入力は null に寄せる。 */
function toNullableString(value: unknown): string | null {
  const trimmed = toTrimmedString(value);
  return trimmed === "" ? null : trimmed;
}

const amountSchema = z.preprocess(
  (value) => {
    const trimmed = toTrimmedString(value);

    if (trimmed === "") {
      return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? trimmed : parsed;
  },
  z
    .number({ error: "金額を入力してください" })
    .int("金額は整数で入力してください")
    .min(1, "金額は1円以上で入力してください")
    .max(2147483647, "金額は2,147,483,647円以下で入力してください"),
);

const dateSchema = z.preprocess(
  toTrimmedString,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付を入力してください")
    .refine((value) => {
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
      );
    }, "存在しない日付です"),
);

const nameSchema = z
  .string()
  .min(1, "名前を入力してください")
  .max(30, "名前は30文字以内で入力してください");

export const expenseSchema = z.object({
  amount: amountSchema,
  date: dateSchema,
  categoryId: z.preprocess(
    toTrimmedString,
    z.string().min(1, "大カテゴリを選択してください"),
  ),
  subcategoryId: z.preprocess(toNullableString, z.string().nullable()),
  merchant: z.preprocess(
    toNullableString,
    z.string().max(100, "支出先は100文字以内で入力してください").nullable(),
  ),
  memo: z.preprocess(
    toNullableString,
    z.string().max(500, "メモは500文字以内で入力してください").nullable(),
  ),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const categoryNameSchema = z.object({
  name: z.preprocess(toTrimmedString, nameSchema),
});

export type CategoryNameInput = z.infer<typeof categoryNameSchema>;

export const subcategoryCreateSchema = z.object({
  categoryId: z.preprocess(
    toTrimmedString,
    z.string().min(1, "大カテゴリを選択してください"),
  ),
  name: z.preprocess(toTrimmedString, nameSchema),
});

export type SubcategoryCreateInput = z.infer<typeof subcategoryCreateSchema>;

/**
 * ZodError を FormData のフィールド名をキーにした辞書へ変換する。
 * キーはフォームの name 属性と完全に一致させる必要がある。
 */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (typeof key !== "string") {
      continue;
    }

    const messages = fieldErrors[key] ?? [];
    messages.push(issue.message);
    fieldErrors[key] = messages;
  }

  return fieldErrors;
}
