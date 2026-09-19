"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dateInputToUtc } from "@/lib/format";
import { incomeSchema, recurringFixedSchema } from "@/lib/ledger-validation";
import type { ActionState } from "@/lib/action-state";

function failure(error: unknown): ActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return { ok: false, message: "カテゴリが見つかりません。選び直してください。" };
  console.error(error);
  return { ok: false, message: "保存に失敗しました。もう一度お試しください。" };
}
function refreshCashflow() {
  revalidatePath("/income"); revalidatePath("/dashboard"); revalidatePath("/fixed-expenses"); revalidatePath("/settings/recurring-fixed");
}
export async function saveIncomeAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = incomeSchema.safeParse({ id: String(form.get("id") ?? "") || undefined, date: form.get("date"), type: form.get("type"), amount: form.get("amount"), memo: form.get("memo") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(" / ") };
  const { id, date, ...rest } = parsed.data;
  const data = { ...rest, date: dateInputToUtc(date)! };
  try { if (id) await prisma.income.update({ where: { id }, data }); else await prisma.income.create({ data }); } catch (error) { return failure(error); }
  refreshCashflow();
  return { ok: true, message: id ? "収入を更新しました" : "収入を登録しました" };
}
export async function deleteIncomeAction(form: FormData) {
  const id = String(form.get("id") ?? ""); if (id) await prisma.income.delete({ where: { id } }); refreshCashflow();
}
export async function saveRecurringFixedAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = recurringFixedSchema.safeParse({ id: String(form.get("id") ?? "") || undefined, categoryId: form.get("categoryId"), amount: form.get("amount"), memo: form.get("memo"), dueDay: form.get("dueDay"), startMonth: form.get("startMonth"), active: form.get("active") ?? false });
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(" / ") };
  const { id, ...data } = parsed.data;
  try { if (id) await prisma.recurringFixedExpense.update({ where: { id }, data }); else await prisma.recurringFixedExpense.create({ data }); } catch (error) { return failure(error); }
  refreshCashflow();
  return { ok: true, message: id ? "自動作成ルールを更新しました" : "自動作成ルールを追加しました" };
}
export async function deleteRecurringFixedAction(form: FormData) {
  const id = String(form.get("id") ?? ""); if (id) await prisma.recurringFixedExpense.delete({ where: { id } }); refreshCashflow();
}
