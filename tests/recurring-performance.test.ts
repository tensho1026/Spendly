import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";
import { ensureRecurringFixed } from "../src/lib/ledger";

const rule = {
  id: "rule",
  categoryId: "living",
  amount: 80000,
  memo: "家賃",
  dueDay: 25,
};

test("opening a month with no active recurring rules does not write", async () => {
  const db = {
    recurringFixedExpense: { findMany: async () => [] },
    fixedExpense: { findMany: async () => assert.fail("fixed expenses should not be queried") },
    $transaction: async () => assert.fail("no transaction should start"),
  } as unknown as PrismaClient;

  await ensureRecurringFixed("2026-09", db);
});

test("opening a month with all recurring items present does not write", async () => {
  const db = {
    recurringFixedExpense: { findMany: async () => [rule] },
    fixedExpense: { findMany: async () => [{ recurringId: rule.id }] },
    $transaction: async () => assert.fail("no transaction should start"),
  } as unknown as PrismaClient;

  await ensureRecurringFixed("2026-09", db);
});

test("a rule enabled later is generated for an existing month", async () => {
  const created: unknown[] = [];
  const db = {
    recurringFixedExpense: { findMany: async () => [rule] },
    fixedExpense: { findMany: async () => [] },
    $transaction: async (run: (tx: unknown) => Promise<void>) =>
      run({
        fixedMonth: {
          upsert: async () => undefined,
          update: async () => undefined,
        },
        fixedExpense: {
          createMany: async ({ data }: { data: unknown[] }) => {
            created.push(...data);
          },
        },
      }),
  } as unknown as PrismaClient;

  await ensureRecurringFixed("2026-09", db);
  assert.deepEqual(created, [{
    month: "2026-09",
    categoryId: "living",
    amount: 80000,
    memo: "家賃",
    dueDay: 25,
    recurringId: "rule",
    sortOrder: 0,
  }]);
});
