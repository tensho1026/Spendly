"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  formString,
  prismaActionFailure,
  validationFailure,
} from "@/lib/action-errors";
import { wishSchema, purchaseSchema } from "@/lib/monthly-planning";
import { PurchaseError, recordWishPurchase } from "@/lib/wishlist";
import { prisma } from "@/lib/prisma";

function refresh() {
  for (const path of [
    "/wishlist",
    "/dashboard",
    "/reports",
    "/monthly-review",
    "/budgets",
    "/notifications",
  ])
    revalidatePath(path);
  revalidatePath("/expenses", "layout");
}
function failure(error: unknown): ActionState {
  if (error instanceof PurchaseError)
    return { ok: false, message: error.message };
  return prismaActionFailure(error, {
    fallback: "保存できませんでした。再読み込みしてからお試しください。",
    foreignKey: "カテゴリが見つかりません。選び直してください。",
    notFound: "ほしいものが見つかりません。再読み込みしてください。",
    logLabel: "ほしいものの保存に失敗",
  });
}
export async function saveWishAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = wishSchema.safeParse(
    Object.fromEntries(
      ["id", "name", "amount", "url", "memo"].map((key) => [
        key,
        formString(form, key),
      ]),
    ),
  );
  if (!parsed.success) return validationFailure(parsed.error);
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.wishItem.update({ where: { id }, data });
    else await prisma.wishItem.create({ data });
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect("/wishlist?saved=1");
}
export async function changeWishAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const id = formString(form, "id"),
    intent = formString(form, "intent");
  if (!id || !["delete", "purchased", "restore"].includes(intent))
    return { ok: false, message: "操作が不正です。" };
  try {
    if (intent === "delete") await prisma.wishItem.delete({ where: { id } });
    else if (intent === "purchased") {
      const result = await prisma.wishItem.updateMany({
        where: { id, purchasedAt: null },
        data: { purchasedAt: new Date() },
      });
      if (!result.count)
        return { ok: false, message: "すでに購入済みか、削除されています。" };
    } else {
      const result = await prisma.wishItem.updateMany({
        where: { id, dailyId: null },
        data: { purchasedAt: null },
      });
      if (!result.count)
        return {
          ok: false,
          message:
            "支出登録済みの品は戻せません。日々の支出で記録を確認してください。",
        };
    }
  } catch (error) {
    return failure(error);
  }
  refresh();
  return {
    ok: true,
    message:
      intent === "delete"
        ? "リストから削除しました（支出記録は残ります）"
        : intent === "restore"
          ? "ほしいものに戻しました"
          : "購入済みにしました（支出は追加していません）",
  };
}
export async function purchaseWishAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = purchaseSchema.safeParse(
    Object.fromEntries(
      ["id", "date", "categoryId", "amount"].map((key) => [
        key,
        formString(form, key),
      ]),
    ),
  );
  if (!parsed.success) return validationFailure(parsed.error);
  let dailyId: string;
  try {
    dailyId = await recordWishPurchase(prisma, parsed.data);
  } catch (error) {
    return failure(error);
  }
  refresh();
  redirect(`/expenses/${dailyId}`);
}
