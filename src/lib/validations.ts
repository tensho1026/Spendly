import { z } from "zod";

/** FormData の値（string | File | null）を必ず trim 済みの文字列にする。 */
function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const nameSchema = z
  .string()
  .min(1, "名前を入力してください")
  .max(30, "名前は30文字以内で入力してください");

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
