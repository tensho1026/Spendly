"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import {
  formString,
  prismaActionFailure,
  validationFailure,
} from "@/lib/action-errors";
import { dateInputToUtc } from "@/lib/format";
import { incomeSchema, recurringFixedSchema } from "@/lib/ledger-validation";
import { prisma } from "@/lib/prisma";

const SAVE_ERROR = "保存に失敗しました。もう一度お試しください。";

function failure(error: unknown): ActionState {
  return prismaActionFailure(error, {
    fallback: SAVE_ERROR,
    foreignKey: "カテゴリが見つかりません。選び直してください。",
    notFound: "対象の記録が見つかりません。画面を再読み込みしてください。",
    logLabel: "収支データの保存に失敗しました",
  });
}

function refreshCashflow() {
  revalidatePath("/income");
  revalidatePath("/dashboard");
  revalidatePath("/fixed-expenses");
  revalidatePath("/settings/recurring-fixed");
}

export async function saveIncomeAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = incomeSchema.safeParse({
    id: formString(form, "id") || undefined,
    date: form.get("date"),
    type: form.get("type"),
    amount: form.get("amount"),
    memo: form.get("memo"),
  });
  if (!parsed.success) return validationFailure(parsed.error);

  const { id, date, ...rest } = parsed.data;
  const data = { ...rest, date: dateInputToUtc(date)! };
  try {
    if (id) await prisma.income.update({ where: { id }, data });
    else await prisma.income.create({ data });
  } catch (error) {
    return failure(error);
  }

  refreshCashflow();
  return {
    ok: true,
    message: id ? "収入を更新しました" : "収入を登録しました",
  };
}

export async function deleteIncomeAction(form: FormData) {
  const id = formString(form, "id");
  if (!id) return;
  try {
    await prisma.income.delete({ where: { id } });
  } catch (error) {
    console.error("収入の削除に失敗しました", error);
    return;
  }
  refreshCashflow();
}

export async function saveRecurringFixedAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = recurringFixedSchema.safeParse({
    id: formString(form, "id") || undefined,
    categoryId: form.get("categoryId"),
    amount: form.get("amount"),
    memo: form.get("memo"),
    dueDay: form.get("dueDay"),
    startMonth: form.get("startMonth"),
    active: form.get("active") ?? false,
  });
  if (!parsed.success) return validationFailure(parsed.error);

  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.recurringFixedExpense.update({ where: { id }, data });
    else await prisma.recurringFixedExpense.create({ data });
  } catch (error) {
    return failure(error);
  }

  refreshCashflow();
  return {
    ok: true,
    message: id ? "自動作成ルールを更新しました" : "自動作成ルールを追加しました",
  };
}

export async function deleteRecurringFixedAction(form: FormData) {
  const id = formString(form, "id");
  if (!id) return;
  try {
    await prisma.recurringFixedExpense.delete({ where: { id } });
  } catch (error) {
    console.error("自動作成ルールの削除に失敗しました", error);
    return;
  }
  refreshCashflow();
}
