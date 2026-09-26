import { Prisma, type PrismaClient } from "@prisma/client";
import { dateInputToUtc } from "@/lib/format";
import { MAX_MONEY } from "@/lib/monthly-planning";

export class PurchaseError extends Error {}

/** A purchase, the day's total, and its breakdown must commit together. */
export async function recordWishPurchase(
  db: PrismaClient,
  data: { id: string; date: string; categoryId: string; amount: number },
) {
  return db.$transaction(
    async (tx) => {
      const wish = await tx.wishItem.findUnique({ where: { id: data.id } });
      if (!wish) throw new PurchaseError("ほしいものが見つかりません。");
      if (wish.purchasedAt)
        throw new PurchaseError(
          "このほしいものは購入済みです。二重登録は行いませんでした。",
        );
      const date = dateInputToUtc(data.date);
      if (!date) throw new PurchaseError("正しい購入日を入力してください。");
      const existing = await tx.dailyExpense.findUnique({
        where: { date },
        include: { items: true },
      });
      if ((existing?.total ?? 0) + data.amount > MAX_MONEY)
        throw new PurchaseError("この日の合計が金額の上限を超えます。");
      if ((existing?.items.length ?? 0) >= 100)
        throw new PurchaseError("この日の内訳は100行までです。");
      const day = await tx.dailyExpense.upsert({
        where: { date },
        create: { date, total: data.amount },
        update: { total: { increment: data.amount } },
      });
      const sortOrder = existing?.items.length
        ? Math.max(...existing.items.map((item) => item.sortOrder)) + 1
        : 0;
      await tx.expense.create({
        data: {
          dailyId: day.id,
          date,
          categoryId: data.categoryId,
          amount: data.amount,
          memo: wish.name,
          sortOrder,
        },
      });
      await tx.wishItem.update({
        where: { id: wish.id },
        data: { purchasedAt: date, dailyId: day.id },
      });
      return day.id;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    },
  );
}
