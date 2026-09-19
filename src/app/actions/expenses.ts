"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import type { ActionState } from "@/lib/action-state";
import { dateInputToUtc } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { expenseSchema, toFieldErrors } from "@/lib/validations";

const NOT_FOUND_MESSAGE = "対象の支出が見つかりませんでした";
const VALIDATION_MESSAGE = "入力内容を確認してください";
const UNKNOWN_ERROR_MESSAGE =
  "保存に失敗しました。時間をおいて再度お試しください";

/**
 * 小カテゴリの select は候補が 0 件のとき disabled になり FormData に載らない。
 * 「キーが無い」場合も「空文字」の場合も未選択として扱う。
 */
function readExpenseInput(formData: FormData) {
  return {
    amount: formData.get("amount"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId"),
    subcategoryId: formData.get("subcategoryId"),
    merchant: formData.get("merchant"),
    memo: formData.get("memo"),
  };
}

function readId(formData: FormData): string {
  const value = formData.get("id");
  return typeof value === "string" ? value.trim() : "";
}

function invalidInput(fieldErrors: Record<string, string[]>): ActionState {
  return { ok: false, fieldErrors, message: VALIDATION_MESSAGE };
}

function revalidateExpensePaths(id?: string): void {
  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  if (id) {
    revalidatePath(`/expenses/${id}`);
  }
}

/** 選択された大カテゴリと小カテゴリの組み合わせが実在するかを確認する。 */
async function validateCategorySelection(
  categoryId: string,
  subcategoryId: string | null,
): Promise<Record<string, string[]> | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    return { categoryId: ["選択した大カテゴリが見つかりませんでした"] };
  }

  if (subcategoryId === null) {
    return null;
  }

  const subcategory = await prisma.subcategory.findUnique({
    where: { id: subcategoryId },
    select: { categoryId: true },
  });

  if (!subcategory || subcategory.categoryId !== categoryId) {
    return { subcategoryId: ["選択した詳細カテゴリが見つかりませんでした"] };
  }

  return null;
}

export async function createExpenseAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = expenseSchema.safeParse(readExpenseInput(formData));

  if (!parsed.success) {
    return invalidInput(toFieldErrors(parsed.error));
  }

  const input = parsed.data;
  const date = dateInputToUtc(input.date);

  if (!date) {
    return invalidInput({ date: ["日付を入力してください"] });
  }

  let createdId: string;

  try {
    const selectionErrors = await validateCategorySelection(
      input.categoryId,
      input.subcategoryId,
    );

    if (selectionErrors) {
      return invalidInput(selectionErrors);
    }

    const created = await prisma.expense.create({
      data: {
        amount: input.amount,
        date,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        merchant: input.merchant,
        memo: input.memo,
      },
      select: { id: true },
    });

    createdId = created.id;
  } catch (error) {
    console.error("支出の作成に失敗しました", error);
    return { ok: false, message: UNKNOWN_ERROR_MESSAGE };
  }

  revalidateExpensePaths(createdId);
  // redirect() は NEXT_REDIRECT を throw するため、必ず try/catch の外で呼ぶ。
  redirect(`/expenses/${createdId}`);
}

export async function updateExpenseAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);

  if (!id) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  const parsed = expenseSchema.safeParse(readExpenseInput(formData));

  if (!parsed.success) {
    return invalidInput(toFieldErrors(parsed.error));
  }

  const input = parsed.data;
  const date = dateInputToUtc(input.date);

  if (!date) {
    return invalidInput({ date: ["日付を入力してください"] });
  }

  try {
    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return { ok: false, message: NOT_FOUND_MESSAGE };
    }

    const selectionErrors = await validateCategorySelection(
      input.categoryId,
      input.subcategoryId,
    );

    if (selectionErrors) {
      return invalidInput(selectionErrors);
    }

    await prisma.expense.update({
      where: { id },
      data: {
        amount: input.amount,
        date,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        merchant: input.merchant,
        memo: input.memo,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, message: NOT_FOUND_MESSAGE };
    }

    console.error("支出の更新に失敗しました", error);
    return { ok: false, message: UNKNOWN_ERROR_MESSAGE };
  }

  revalidateExpensePaths(id);
  redirect(`/expenses/${id}`);
}

export async function deleteExpenseAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);

  if (!id) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  try {
    await prisma.expense.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, message: NOT_FOUND_MESSAGE };
    }

    console.error("支出の削除に失敗しました", error);
    return {
      ok: false,
      message: "削除に失敗しました。時間をおいて再度お試しください",
    };
  }

  revalidateExpensePaths(id);
  redirect("/expenses");
}
