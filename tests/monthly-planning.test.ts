import test from "node:test";
import assert from "node:assert/strict";
import {
  monthlyProgress,
  livingBudgetSchema,
  wishSchema,
  purchaseSchema,
} from "../src/lib/monthly-planning";

const month = { year: 2026, month: 9 };
const day = (date: string, total: number, amount = total) => ({
  date: `${date}T00:00:00+09:00`,
  total,
  items: [{ amount }],
});
test("remaining budget uses daily totals, including future reservations, without requiring matching breakdowns", () => {
  const result = monthlyProgress(
    month,
    [day("2026-09-01", 36000, 10000), day("2026-09-30", 1000)],
    60000,
    new Date("2026-09-19T00:00:00+09:00"),
  );
  assert.equal(result.spent, 37000);
  assert.equal(result.remaining, 23000);
  assert.equal(result.remainingDays, 12);
  assert.equal(result.dailyAllowance, 1916);
  assert.equal(result.mismatchedDays, 1);
  assert.equal(result.missingDates.length, 18);
});
test("unset budget, zero budget and overspending are distinct", () => {
  const days = [day("2026-09-01", 100)];
  const now = new Date("2026-09-30T12:00:00+09:00");
  assert.equal(monthlyProgress(month, days, null, now).remaining, null);
  const over = monthlyProgress(month, days, 0, now);
  assert.equal(over.remaining, -100);
  assert.equal(over.dailyAllowance, 0);
  assert.equal(over.remainingDays, 1);
});
test("past months have no daily allowance; zero-spend entries count as recorded", () => {
  const result = monthlyProgress(
    month,
    [day("2026-09-01", 0)],
    60000,
    new Date("2026-10-01T00:00:00+09:00"),
  );
  assert.equal(result.remainingDays, 0);
  assert.equal(result.dailyAllowance, null);
  assert.equal(result.missingDates.length, 29);
  assert.equal(result.canClose, true);
});
test("future months and leap years use the whole month with no missing days", () => {
  const result = monthlyProgress(
    { year: 2028, month: 2 },
    [],
    2900,
    new Date("2027-12-31T23:59:00+09:00"),
  );
  assert.equal(result.remainingDays, 29);
  assert.equal(result.dailyAllowance, 100);
  assert.deepEqual(result.missingDates, []);
  assert.equal(result.canClose, false);
});
test("JST month boundary changes close eligibility", () => {
  assert.equal(
    monthlyProgress(month, [], null, new Date("2026-09-30T14:59:59Z")).canClose,
    false,
  );
  assert.equal(
    monthlyProgress(month, [], null, new Date("2026-09-30T15:00:00Z")).canClose,
    true,
  );
});
test("budget validation permits unsetting and zero, rejects bad month and money", () => {
  assert.equal(
    livingBudgetSchema.parse({ month: "2026-09", livingBudget: "" })
      .livingBudget,
    null,
  );
  assert.equal(
    livingBudgetSchema.parse({ month: "2026-09", livingBudget: "0" })
      .livingBudget,
    0,
  );
  for (const livingBudget of ["-1", "1.5", "2147483648", "NaN", "1e4"])
    assert.equal(
      livingBudgetSchema.safeParse({ month: "2026-09", livingBudget }).success,
      false,
    );
  assert.equal(
    livingBudgetSchema.safeParse({ month: "2026-13", livingBudget: "1" })
      .success,
    false,
  );
});
test("wish validation rejects executable URLs and invalid names/prices", () => {
  const wish = {
    id: "",
    name: "イヤホン",
    amount: "1000",
    url: "https://example.com/item",
    memo: "",
  };
  assert.equal(wishSchema.safeParse(wish).success, true);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "file:///tmp/test",
    "bad",
  ])
    assert.equal(wishSchema.safeParse({ ...wish, url }).success, false);
  assert.equal(
    wishSchema.safeParse({ ...wish, name: " ", amount: "0" }).success,
    false,
  );
  assert.equal(
    purchaseSchema.safeParse({
      id: "wish",
      date: "2026-02-30",
      categoryId: "food",
      amount: "100",
    }).success,
    false,
  );
});
