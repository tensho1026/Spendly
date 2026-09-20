"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import {
  formString,
  prismaActionFailure,
  validationFailure,
} from "@/lib/action-errors";
import {
  budgetSchema,
  parseItems,
  templateSchema,
} from "@/lib/ledger-validation";
import { prisma } from "@/lib/prisma";

function failure(error: unknown): ActionState {
  return prismaActionFailure(error, {
    fallback: "保存に失敗しました。もう一度お試しください。",
    foreignKey: "カテゴリが見つかりません。選び直してください。",
    notFound: "対象の記録が見つかりません。画面を再読み込みしてください。",
    logLabel: "計画データの保存に失敗しました",
  });
}

export async function saveBudgetsAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = budgetSchema.safeParse({
    month: form.get("month"),
    budgets: parseItems(form.get("budgets")),
  });
  if (!parsed.success) return validationFailure(parsed.error);

  const { month, budgets } = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.categoryBudget.deleteMany({ where: { month } });
      const positive = budgets.filter((row) => row.amount > 0);
      if (positive.length) {
        await tx.categoryBudget.createMany({
          data: positive.map((row) => ({ ...row, month })),
        });
      }
    });
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect(`/budgets?month=${month}&saved=1`);
}

export async function saveTemplateAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = templateSchema.safeParse({
    id: formString(form, "id") || undefined,
    categoryId: form.get("categoryId"),
    amount: form.get("amount"),
    memo: form.get("memo"),
  });
  if (!parsed.success) return validationFailure(parsed.error);

  const { id, categoryId, amount, memo } = parsed.data;
  const data = { categoryId, amount, memo };
  try {
    if (id) await prisma.expenseTemplate.update({ where: { id }, data });
    else await prisma.expenseTemplate.create({ data });
  } catch (error) {
    return failure(error);
  }

  revalidatePath("/settings/templates");
  revalidatePath("/expenses");
  return {
    ok: true,
    message: id ? "テンプレートを更新しました" : "テンプレートを追加しました",
  };
}

export async function deleteTemplateAction(form: FormData) {
  const id = formString(form, "id");
  if (!id) return;
  try {
    await prisma.expenseTemplate.delete({ where: { id } });
  } catch (error) {
    console.error("テンプレートの削除に失敗しました", error);
    return;
  }
  revalidatePath("/settings/templates");
  revalidatePath("/expenses");
}
