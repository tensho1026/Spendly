"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import {
  formString,
  prismaActionFailure,
  validationFailure,
} from "@/lib/action-errors";
import { livingBudgetSchema, reviewSchema } from "@/lib/monthly-planning";
import { getMonthlyReview } from "@/lib/monthly-review";
import { tryParseMonthParam } from "@/lib/month";
import { ensureRecurringFixed } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

function refresh() {
  for (const path of ["/budgets", "/dashboard", "/monthly-review"])
    revalidatePath(path);
}
function failure(error: unknown): ActionState {
  return prismaActionFailure(error, {
    fallback: "保存できませんでした。画面を再読み込みしてお試しください。",
    logLabel: "月間計画の保存に失敗",
  });
}
export async function saveLivingBudgetAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = livingBudgetSchema.safeParse({
    month: formString(form, "month"),
    livingBudget: formString(form, "livingBudget"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { month, livingBudget } = parsed.data;
  try {
    await prisma.monthlyPlan.upsert({
      where: { month },
      create: { month, livingBudget },
      update: { livingBudget },
    });
  } catch (error) {
    return failure(error);
  }
  refresh();
  return { ok: true, message: "生活費予算を保存しました" };
}
export async function saveMonthlyReviewAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  const parsed = reviewSchema.safeParse({
    month: formString(form, "month"),
    reflection: formString(form, "reflection"),
    intent: formString(form, "intent"),
    acknowledged: form.get("acknowledged") === "on",
    fingerprint: formString(form, "fingerprint"),
  });
  if (!parsed.success) return validationFailure(parsed.error);
  const { month, reflection, intent, acknowledged, fingerprint } = parsed.data;
  try {
    if (intent === "close") await ensureRecurringFixed(month);
    const result = await prisma.$transaction(
      async (tx) => {
        const review = await getMonthlyReview(tryParseMonthParam(month)!, tx);
        if (intent === "close") {
          if (!review.progress.canClose)
            return {
              ok: false,
              message:
                "月締めは翌月になってから行えます。メモは今から保存できます。",
            };
          if (review.fingerprint !== fingerprint)
            return {
              ok: false,
              message:
                "記録が更新されました。画面を再読み込みして内容を確認してください。",
            };
          if (!acknowledged)
            return {
              ok: false,
              message: "入力状況と収支の確認にチェックしてください。",
            };
        }
        const status =
          intent === "close"
            ? { closedAt: new Date(), closedFingerprint: review.fingerprint }
            : intent === "reopen"
              ? { closedAt: null, closedFingerprint: null }
              : {};
        await tx.monthlyPlan.upsert({
          where: { month },
          create: { month, reflection, ...status },
          update: { reflection, ...status },
        });
        return {
          ok: true,
          message:
            intent === "close"
              ? "この月を締めました"
              : intent === "reopen"
                ? "月締めを解除しました"
                : "振り返りを保存しました",
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
      },
    );
    refresh();
    return result;
  } catch (error) {
    return failure(error);
  }
}
