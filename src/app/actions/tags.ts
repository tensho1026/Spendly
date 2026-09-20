"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/action-state";
import {
  formString,
  prismaActionFailure,
  validationFailure,
} from "@/lib/action-errors";
import { tagSchema } from "@/lib/ledger-validation";
import { prisma } from "@/lib/prisma";

function refreshTags() {
  revalidatePath("/settings/tags");
  revalidatePath("/expenses", "layout");
  revalidatePath("/reports");
}

export async function saveTagAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = tagSchema.safeParse({
    id: formString(form, "id") || undefined,
    name: form.get("name"),
    color: form.get("color"),
  });
  if (!parsed.success) return validationFailure(parsed.error);

  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.tag.update({ where: { id }, data });
    else await prisma.tag.create({ data });
  } catch (error) {
    return prismaActionFailure(error, {
      fallback: "タグの保存に失敗しました",
      duplicate: "同じ名前のタグがすでにあります",
      notFound: "対象のタグが見つかりません。画面を再読み込みしてください。",
      logLabel: "タグの保存に失敗しました",
    });
  }

  refreshTags();
  return { ok: true, message: id ? "タグを更新しました" : "タグを追加しました" };
}

export async function deleteTagAction(form: FormData) {
  const id = formString(form, "id");
  if (!id) return;
  try {
    await prisma.tag.delete({ where: { id } });
  } catch (error) {
    console.error("タグの削除に失敗しました", error);
    return;
  }
  refreshTags();
}
