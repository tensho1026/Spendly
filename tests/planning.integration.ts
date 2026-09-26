import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { recordWishPurchase } from "../src/lib/wishlist";
import { getMonthlyReview } from "../src/lib/monthly-review";
import { dateInputToUtc } from "../src/lib/format";

async function main() {
  if (!process.env.TEST_DATABASE_URL)
    throw new Error("Set TEST_DATABASE_URL to a disposable test database.");
  const schema = `planning_test_${Date.now()}`;
  const url = new URL(process.env.TEST_DATABASE_URL);
  const admin = new PrismaClient({ datasourceUrl: url.toString() });
  url.searchParams.set("schema", schema);
  const db = new PrismaClient({ datasourceUrl: url.toString() });
  try {
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    execFileSync("npx", ["prisma", "migrate", "deploy"], {
      env: {
        ...process.env,
        DATABASE_URL: url.toString(),
        DIRECT_URL: url.toString(),
      },
      stdio: "pipe",
    });
    const category = await db.category.create({ data: { name: "テスト" } });
    const day = await db.dailyExpense.create({
      data: {
        date: dateInputToUtc("2026-08-01")!,
        total: 1000,
        items: {
          create: {
            date: dateInputToUtc("2026-08-01")!,
            amount: 500,
            categoryId: category.id,
            memo: "既存の内訳",
          },
        },
      },
    });
    const wish = await db.wishItem.create({
      data: { name: "イヤホン", amount: 2000 },
    });
    const input = {
      id: wish.id,
      date: "2026-08-01",
      categoryId: category.id,
      amount: 1800,
    };
    const results = await Promise.allSettled([
      recordWishPurchase(db, input),
      recordWishPurchase(db, input),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
      "only one concurrent purchase succeeds",
    );
    const saved = await db.dailyExpense.findUniqueOrThrow({
      where: { id: day.id },
      include: { items: true },
    });
    assert.equal(saved.total, 2800);
    assert.equal(saved.items.length, 2);
    assert.equal(
      saved.items.reduce((sum, item) => sum + item.amount, 0),
      2300,
      "existing unmatched amount is preserved",
    );
    assert.equal(
      (await db.wishItem.findUniqueOrThrow({ where: { id: wish.id } })).dailyId,
      day.id,
    );
    await assert.rejects(recordWishPurchase(db, input), /購入済み/);
    const invalid = await db.wishItem.create({
      data: { name: "失敗テスト", amount: 100 },
    });
    await assert.rejects(
      recordWishPurchase(db, {
        ...input,
        id: invalid.id,
        categoryId: "missing",
      }),
    );
    assert.equal(
      (await db.dailyExpense.findUniqueOrThrow({ where: { id: day.id } }))
        .total,
      2800,
      "foreign-key failure rolls back total",
    );
    assert.equal(
      (await db.wishItem.findUniqueOrThrow({ where: { id: invalid.id } }))
        .purchasedAt,
      null,
    );
    await assert.rejects(
      recordWishPurchase(db, { ...input, id: invalid.id, amount: 2147483647 }),
      /上限/,
    );
    const newDayId = await recordWishPurchase(db, {
      ...input,
      id: invalid.id,
      date: "2026-08-02",
      amount: 100,
    });
    assert.equal(
      (await db.dailyExpense.findUniqueOrThrow({ where: { id: newDayId } }))
        .total,
      100,
    );
    const month = { year: 2026, month: 8 };
    await db.monthlyPlan.create({
      data: {
        month: "2026-08",
        livingBudget: 60000,
        reflection: "夏の振り返り",
      },
    });
    const before = await getMonthlyReview(month, db);
    await db.monthlyPlan.update({
      where: { month: "2026-08" },
      data: { closedAt: new Date(), closedFingerprint: before.fingerprint },
    });
    assert.equal((await getMonthlyReview(month, db)).changedSinceClose, false);
    await db.monthlyPlan.update({
      where: { month: "2026-08" },
      data: { reflection: "メモの追記" },
    });
    assert.equal(
      (await getMonthlyReview(month, db)).changedSinceClose,
      false,
      "editing reflection does not invalidate ledger review",
    );
    await db.dailyExpense.update({
      where: { id: day.id },
      data: { total: 2900 },
    });
    assert.equal((await getMonthlyReview(month, db)).changedSinceClose, true);
    await db.dailyExpense.delete({ where: { id: day.id } });
    const detached = await db.wishItem.findUniqueOrThrow({
      where: { id: wish.id },
    });
    assert.equal(
      detached.dailyId,
      null,
      "deleting a day preserves wish and clears link",
    );
    assert.ok(detached.purchasedAt);
    console.log(
      "PASS: purchase concurrency, rollback, existing/new days, limits, closing fingerprint and deletion integrity",
    );
  } finally {
    await db.$disconnect();
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
