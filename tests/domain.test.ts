import assert from "node:assert/strict";
import test from "node:test";
import {
  dateInputToUtc,
  toDateInputValue,
  jstParts,
  formatYen,
} from "../src/lib/format";
import { monthRange, shiftMonth, tryParseMonthParam } from "../src/lib/month";
import { buildCalendarDays, combineCategorySpend, percentage } from "../src/lib/planning";
import { categoryNameSchema } from "../src/lib/validations";

test("JST midnight is persisted without moving the calendar date", () => {
  const date = dateInputToUtc("2026-09-01")!;
  assert.equal(date.toISOString(), "2026-08-31T15:00:00.000Z");
  assert.equal(toDateInputValue(date), "2026-09-01");
  assert.deepEqual(jstParts("2026-08-31T15:00:00.000Z"), {
    year: 2026,
    month: 9,
    day: 1,
  });
});
test("invalid dates and non-leap days are rejected", () => {
  for (const date of ["2026-02-29", "2026-02-31", "2026-13-01", "invalid"]) {
    assert.equal(dateInputToUtc(date), null);
  }
  assert.ok(dateInputToUtc("2024-02-29"));
});
test("monthly ranges use exclusive next-month boundary across years", () => {
  const { start, end } = monthRange({ year: 2026, month: 12 });
  assert.equal(start.toISOString(), "2026-11-30T15:00:00.000Z");
  assert.equal(end.toISOString(), "2026-12-31T15:00:00.000Z");
  assert.deepEqual(shiftMonth({ year: 2026, month: 1 }, -1), {
    year: 2025,
    month: 12,
  });
});
test("invalid month queries are ignored", () => {
  for (const month of ["2026-00", "2026-13", "0099-01", "2026-9", "bad"])
    assert.equal(tryParseMonthParam(month), null);
});
test("category names reject blanks and overly long text", () => {
  assert.equal(categoryNameSchema.safeParse({ name: "  " }).success, false);
  assert.equal(
    categoryNameSchema.safeParse({ name: "あ".repeat(31) }).success,
    false,
  );
  assert.equal(categoryNameSchema.parse({ name: " 食費 " }).name, "食費");
});
test("yen display includes separators and no fractional currency", () => {
  assert.equal(formatYen(29830), "¥29,830");
  assert.equal(formatYen(-1200), "-¥1,200");
});

import {
  dailySchema,
  fixedSchema,
  parseItems,
  sumItems,
} from "../src/lib/ledger-validation";
const row = { categoryId: "food", amount: "1000", memo: " 昼食 " };
test("a day accepts multiple categories, repeated categories and an independent total", () => {
  const parsed = dailySchema.parse({
    date: "2026-09-19",
    total: "5000",
    items: [
      row,
      { ...row, amount: "1200" },
      { categoryId: "travel", amount: "500", memo: "電車" },
    ],
  });
  assert.equal(parsed.total, 5000);
  assert.equal(sumItems(parsed.items), 2700);
  assert.equal(parsed.items[0].memo, "昼食");
});
test("daily totals allow incomplete breakdowns, overages and zero-spend days", () => {
  for (const input of [
    { total: "0", items: [] },
    { total: "2000", items: [] },
    { total: "500", items: [row] },
  ]) {
    assert.equal(
      dailySchema.safeParse({ date: "2026-09-19", ...input }).success,
      true,
    );
  }
});
test("invalid rows reject the whole day instead of silently losing a line", () => {
  for (const invalid of [
    { ...row, amount: "0" },
    { ...row, amount: "1.2" },
    { ...row, amount: "" },
    { ...row, categoryId: "" },
    { ...row, memo: "a".repeat(501) },
  ]) {
    assert.equal(
      dailySchema.safeParse({
        date: "2026-09-19",
        total: "5000",
        items: [row, invalid],
      }).success,
      false,
    );
  }
  assert.equal(
    dailySchema.safeParse({ date: "2026-09-19", total: "", items: [] }).success,
    false,
  );
  assert.equal(
    dailySchema.safeParse({
      date: "2026-09-19",
      total: "2147483648",
      items: [],
    }).success,
    false,
  );
});
test("fixed expenses belong to a month and can be cleared without a daily date", () => {
  assert.equal(
    fixedSchema.safeParse({ month: "2026-09", items: [row] }).success,
    true,
  );
  assert.equal(
    fixedSchema.safeParse({ month: "2026-09", items: [] }).success,
    true,
  );
  assert.equal(
    fixedSchema.safeParse({ month: "2026-13", items: [row] }).success,
    false,
  );
});
test("malformed or oversized item lists are rejected", () => {
  assert.equal(parseItems("{broken"), null);
  assert.equal(parseItems(null), null);
  assert.equal(
    dailySchema.safeParse({
      date: "2026-09-19",
      total: 5000,
      items: Array(101).fill(row),
    }).success,
    false,
  );
});

test("category spending combines daily breakdowns and fixed costs", () => {
  const rows = combineCategorySpend(
    [{ categoryId: "food", name: "食費", amount: 1200 }],
    [{ categoryId: "food", name: "食費", amount: 800 }, { categoryId: "rent", name: "家賃", amount: 50000 }],
  );
  assert.deepEqual(rows, [
    { categoryId: "rent", name: "家賃", amount: 50000 },
    { categoryId: "food", name: "食費", amount: 2000 },
  ]);
  assert.equal(percentage(33000, 30000), 110);
  assert.equal(percentage(1000, 0), 0);
});

test("calendar marks matched, mismatched, missing and future days", () => {
  const cells = buildCalendarDays(
    { year: 2026, month: 9 },
    [
      { id: "one", date: "2026-08-31T15:00:00.000Z", total: 1000, itemTotal: 1000 },
      { id: "two", date: "2026-09-01T15:00:00.000Z", total: 2000, itemTotal: 1500 },
    ],
    new Date("2026-09-03T03:00:00.000Z"),
  ).filter((cell) => cell !== null);
  assert.equal(cells[0].status, "matched");
  assert.equal(cells[1].status, "mismatch");
  assert.equal(cells[2].status, "missing");
  assert.equal(cells[3].status, "future");
});
