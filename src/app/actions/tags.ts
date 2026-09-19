"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { tagSchema } from "@/lib/ledger-validation";
import type { ActionState } from "@/lib/action-state";

function refresh() { revalidatePath("/settings/tags"); revalidatePath("/expenses", "layout"); revalidatePath("/reports"); }
export async function saveTagAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = tagSchema.safeParse({ id: String(form.get("id") ?? "") || undefined, name: form.get("name"), color: form.get("color") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(" / ") };
  const { id, ...data } = parsed.data;
  try { if (id) await prisma.tag.update({ where: { id }, data }); else await prisma.tag.create({ data }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, message: "同じ名前のタグがすでにあります" };
    return { ok: false, message: "タグの保存に失敗しました" };
  }
  refresh(); return { ok: true, message: id ? "タグを更新しました" : "タグを追加しました" };
}
export async function deleteTagAction(form: FormData) { const id = String(form.get("id") ?? ""); if (id) await prisma.tag.delete({ where: { id } }); refresh(); }
