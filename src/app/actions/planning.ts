"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { budgetSchema, parseItems, templateSchema } from "@/lib/ledger-validation";
import type { ActionState } from "@/lib/action-state";

function message(error: unknown): ActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003")
    return { ok: false, message: "カテゴリが見つかりません。選び直してください。" };
  console.error(error);
  return { ok: false, message: "保存に失敗しました。もう一度お試しください。" };
}

export async function saveBudgetsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = budgetSchema.safeParse({ month: form.get("month"), budgets: parseItems(form.get("budgets")) });
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(" / ") };
  const { month, budgets } = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.categoryBudget.deleteMany({ where: { month } });
      const positive = budgets.filter((row) => row.amount > 0);
      if (positive.length) await tx.categoryBudget.createMany({ data: positive.map((row) => ({ ...row, month })) });
    });
  } catch (error) { return message(error); }
  revalidatePath("/budgets"); revalidatePath("/dashboard");
  redirect(`/budgets?month=${month}&saved=1`);
}

export async function saveTemplateAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = templateSchema.safeParse({ id: String(form.get("id") ?? "") || undefined, categoryId: form.get("categoryId"), amount: form.get("amount"), memo: form.get("memo") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(" / ") };
  const { id, categoryId, amount, memo } = parsed.data;
  const data = { categoryId, amount, memo };
  try {
    if (id) await prisma.expenseTemplate.update({ where: { id }, data });
    else await prisma.expenseTemplate.create({ data });
  } catch (error) { return message(error); }
  revalidatePath("/settings/templates"); revalidatePath("/expenses");
  return { ok: true, message: id ? "テンプレートを更新しました" : "テンプレートを追加しました" };
}

export async function deleteTemplateAction(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (id) await prisma.expenseTemplate.delete({ where: { id } });
  revalidatePath("/settings/templates"); revalidatePath("/expenses");
}
