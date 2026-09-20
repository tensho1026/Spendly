"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import {
  categoryNameSchema,
  subcategoryCreateSchema,
  toFieldErrors,
} from "@/lib/validations";

const VALIDATION_MESSAGE = "入力内容を確認してください";
const CATEGORY_NOT_FOUND = "対象の大カテゴリが見つかりませんでした";
const SUBCATEGORY_NOT_FOUND = "対象の詳細カテゴリが見つかりませんでした";
const DUPLICATE_CATEGORY = "同じ名前のカテゴリがすでに存在します";
const DUPLICATE_SUBCATEGORY = "同じ名前の詳細カテゴリがすでに存在します";

function readId(formData: FormData, key = "id"): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function invalidInput(fieldErrors: Record<string, string[]>): ActionState {
  return { ok: false, fieldErrors, message: VALIDATION_MESSAGE };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function revalidateCategoryPaths(): void {
  revalidatePath("/settings/categories");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/expenses", "layout");
  revalidatePath("/fixed-expenses");
}

export async function createCategoryAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categoryNameSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return invalidInput(toFieldErrors(parsed.error));
  }

  try {
    // 新しい大カテゴリは末尾に並べる。
    const last = await prisma.category.aggregate({ _max: { sortOrder: true } });

    await prisma.category.create({
      data: {
        name: parsed.data.name,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: DUPLICATE_CATEGORY,
        fieldErrors: { name: [DUPLICATE_CATEGORY] },
      };
    }

    console.error("大カテゴリの作成に失敗しました", error);
    return { ok: false, message: "カテゴリの作成に失敗しました" };
  }

  revalidateCategoryPaths();
  return { ok: true, message: "カテゴリを作成しました" };
}

export async function renameCategoryAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);

  if (!id) {
    return { ok: false, message: CATEGORY_NOT_FOUND };
  }

  const parsed = categoryNameSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return invalidInput(toFieldErrors(parsed.error));
  }

  try {
    await prisma.category.update({
      where: { id },
      data: { name: parsed.data.name },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: DUPLICATE_CATEGORY,
        fieldErrors: { name: [DUPLICATE_CATEGORY] },
      };
    }

    if (isRecordNotFound(error)) {
      return { ok: false, message: CATEGORY_NOT_FOUND };
    }

    console.error("大カテゴリの名前変更に失敗しました", error);
    return { ok: false, message: "カテゴリ名の変更に失敗しました" };
  }

  revalidateCategoryPaths();
  return { ok: true, message: "カテゴリ名を変更しました" };
}

export async function deleteCategoryAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);

  if (!id) {
    return { ok: false, message: CATEGORY_NOT_FOUND };
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      return { ok: false, message: CATEGORY_NOT_FOUND };
    }

    // 使用中のカテゴリを消すと支出の履歴が壊れるため、件数を見て止める。
    const [expenses, fixedExpenses, templates, recurringFixedExpenses] =
      await Promise.all([
        prisma.expense.count({ where: { categoryId: id } }),
        prisma.fixedExpense.count({ where: { categoryId: id } }),
        prisma.expenseTemplate.count({ where: { categoryId: id } }),
        prisma.recurringFixedExpense.count({ where: { categoryId: id } }),
      ]);
    const used =
      expenses + fixedExpenses + templates + recurringFixedExpenses;

    if (used > 0) {
      return {
        ok: false,
        message: `この大カテゴリを使っている記録・設定が ${used} 件あるため削除できません`,
      };
    }

    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return { ok: false, message: CATEGORY_NOT_FOUND };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        ok: false,
        message: "この大カテゴリは使用中のため削除できません",
      };
    }

    console.error("大カテゴリの削除に失敗しました", error);
    return { ok: false, message: "カテゴリの削除に失敗しました" };
  }

  revalidateCategoryPaths();
  return { ok: true, message: "カテゴリを削除しました" };
}

export async function createSubcategoryAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = subcategoryCreateSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return invalidInput(toFieldErrors(parsed.error));
  }

  const { categoryId, name } = parsed.data;

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return { ok: false, message: CATEGORY_NOT_FOUND };
    }

    const last = await prisma.subcategory.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });

    await prisma.subcategory.create({
      data: { categoryId, name, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: DUPLICATE_SUBCATEGORY,
        fieldErrors: { name: [DUPLICATE_SUBCATEGORY] },
      };
    }

    console.error("詳細カテゴリの作成に失敗しました", error);
    return { ok: false, message: "詳細カテゴリの作成に失敗しました" };
  }

  revalidateCategoryPaths();
  return { ok: true, message: "詳細カテゴリを作成しました" };
}

export async function renameSubcategoryAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);

  if (!id) {
    return { ok: false, message: SUBCATEGORY_NOT_FOUND };
  }

  const parsed = categoryNameSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return invalidInput(toFieldErrors(parsed.error));
  }

  try {
    await prisma.subcategory.update({
      where: { id },
      data: { name: parsed.data.name },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: DUPLICATE_SUBCATEGORY,
        fieldErrors: { name: [DUPLICATE_SUBCATEGORY] },
      };
    }

    if (isRecordNotFound(error)) {
      return { ok: false, message: SUBCATEGORY_NOT_FOUND };
    }

    console.error("詳細カテゴリの名前変更に失敗しました", error);
    return { ok: false, message: "詳細カテゴリ名の変更に失敗しました" };
  }

  revalidateCategoryPaths();
  return { ok: true, message: "詳細カテゴリ名を変更しました" };
}

export async function deleteSubcategoryAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);

  if (!id) {
    return { ok: false, message: SUBCATEGORY_NOT_FOUND };
  }

  try {
    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!subcategory) {
      return { ok: false, message: SUBCATEGORY_NOT_FOUND };
    }

    const used = await prisma.expense.count({ where: { subcategoryId: id } });

    if (used > 0) {
      return {
        ok: false,
        message: `この詳細カテゴリを使っている支出が ${used} 件あるため削除できません`,
      };
    }

    await prisma.subcategory.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return { ok: false, message: SUBCATEGORY_NOT_FOUND };
    }

    console.error("詳細カテゴリの削除に失敗しました", error);
    return { ok: false, message: "詳細カテゴリの削除に失敗しました" };
  }

  revalidateCategoryPaths();
  return { ok: true, message: "詳細カテゴリを削除しました" };
}
