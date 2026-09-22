"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dateInputToUtc } from "@/lib/format";
import { dailySchema, fixedSchema, parseItems } from "@/lib/ledger-validation";
import { shiftMonth, tryParseMonthParam, formatMonthParam } from "@/lib/month";
import type { ActionState } from "@/lib/action-state";

function refresh() {
  revalidatePath("/expenses", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/fixed-expenses");
  revalidatePath("/settings/categories");
  revalidatePath("/budgets");
}

export async function copyPreviousFixedAction(form: FormData) {
  const month = String(form.get("month") ?? "");
  const parsed = tryParseMonthParam(month);
  if (!parsed) redirect("/fixed-expenses?error=invalid-month");
  const previous = formatMonthParam(shiftMonth(parsed, -1));
  const source = await prisma.fixedExpense.findMany({ where: { month: previous }, orderBy: { sortOrder: "asc" } });
  if (!source.length) redirect(`/fixed-expenses?month=${month}&error=no-source`);
  await prisma.$transaction(async (tx) => {
    await tx.fixedMonth.upsert({ where: { month }, create: { month, recurringGeneratedAt: new Date() }, update: { updatedAt: new Date(), recurringGeneratedAt: new Date() } });
    await tx.fixedExpense.deleteMany({ where: { month } });
    await tx.fixedExpense.createMany({ data: source.map(({ categoryId, amount, memo, dueDay, sortOrder }) => ({ month, categoryId, amount, memo, dueDay, sortOrder })) });
  });
  refresh();
  redirect(`/fixed-expenses?month=${month}&copied=1`);
}
async function validateCategories(items: { categoryId: string }[]) {
  const ids = [...new Set(items.map((item) => item.categoryId))];
  return (
    (await prisma.category.count({ where: { id: { in: ids } } })) === ids.length
  );
}
async function validateTags(items: { tagIds?: string[] }[]) {
  const ids = [...new Set(items.flatMap((item) => item.tagIds ?? []))];
  return ids.length === 0 || (await prisma.tag.count({ where: { id: { in: ids } } })) === ids.length;
}
function failure(error: unknown): ActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return {
        ok: false,
        message:
          "この日付は登録済みです。日々の支出一覧から、その日の記録を編集してください。",
      };
    if (error.code === "P2025")
      return {
        ok: false,
        message: "記録が見つかりません。画面を再読み込みしてください。",
      };
    if (error.code === "P2003")
      return {
        ok: false,
        message: "選択したカテゴリが削除されています。選び直してください。",
      };
  }
  console.error("支出の保存に失敗しました", error);
  return {
    ok: false,
    message:
      "保存に失敗しました。入力内容を残したまま、もう一度お試しください。",
  };
}
export async function saveDailyAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = dailySchema.safeParse({
    id: String(form.get("id") ?? ""),
    date: form.get("date"),
    total: form.get("total"),
    items: parseItems(form.get("items")),
  });
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues
        .map(
          (issue) =>
            `${issue.path[0] === "items" && typeof issue.path[1] === "number" ? `内訳${issue.path[1] + 1}行目: ` : ""}${issue.message}`,
        )
        .join(" / "),
    };
  const { id, total, items } = parsed.data;
  const date = dateInputToUtc(parsed.data.date)!;
  let savedId: string;
  try {
    if (!(await validateCategories(items)))
      return {
        ok: false,
        message: "存在しないカテゴリが含まれています。選び直してください。",
      };
    if (!(await validateTags(items))) return { ok: false, message: "存在しないタグが含まれています。選び直してください。" };
    const data = items.map(({ tagIds, ...item }, sortOrder) => ({ ...item, tagIds, date, sortOrder }));
    const saved = await prisma.$transaction(async (tx) => {
      let dailyId: string;
      if (id) {
        // Replacing the rows and updating the total must commit together.
        await tx.dailyExpense.update({ where: { id }, data: { date, total } });
        await tx.expense.deleteMany({ where: { dailyId: id } });
        dailyId = id;
      } else {
        const day = await tx.dailyExpense.create({ data: { date, total }, select: { id: true } });
        dailyId = day.id;
      }

      if (data.length > 0) {
        const expenses = data.map(({ categoryId, amount, memo, date, sortOrder }) => ({
          categoryId, amount, memo, date, sortOrder, dailyId,
        }));
        if (data.some((item) => item.tagIds.length > 0)) {
          const created = await tx.expense.createManyAndReturn({
            data: expenses,
            select: { id: true, sortOrder: true },
          });
          // createManyAndReturn does not guarantee the order of returned rows.
          const tags = created.flatMap(({ id: expenseId, sortOrder }) =>
            data[sortOrder].tagIds.map((tagId) => ({ expenseId, tagId })),
          );
          await tx.expenseTag.createMany({ data: tags });
        } else {
          await tx.expense.createMany({ data: expenses });
        }
      }
      return { id: dailyId };
    }, { timeout: 15000 });
    savedId = saved.id;
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect(`/expenses/${savedId}`);
}

export async function saveFixedAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = fixedSchema.safeParse({
    month: form.get("month"),
    items: parseItems(form.get("items")),
  });
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join(" / "),
    };
  const { month, items } = parsed.data;
  try {
    if (!(await validateCategories(items)))
      return {
        ok: false,
        message: "存在しないカテゴリが含まれています。選び直してください。",
      };
    await prisma.$transaction(async (tx) => {
      await tx.fixedMonth.upsert({
        where: { month },
        create: { month },
        update: { updatedAt: new Date() },
      });
      await tx.fixedExpense.deleteMany({ where: { month } });
      await tx.fixedExpense.createMany({
        data: items.map(({ categoryId, amount, memo, dueDay }, sortOrder) => ({ categoryId, amount, memo, dueDay, month, sortOrder })),
      });
    });
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect(`/fixed-expenses?month=${encodeURIComponent(month)}&saved=1`);
}

export async function deleteExpenseAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const id = String(form.get("id") ?? "");
  if (!id) return { ok: false, message: "記録が見つかりません" };
  try {
    await prisma.dailyExpense.delete({ where: { id } });
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect("/expenses");
}
