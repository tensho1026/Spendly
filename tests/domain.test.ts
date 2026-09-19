import assert from "node:assert/strict";
import test from "node:test";
import {
  dateInputToUtc,
  toDateInputValue,
  jstParts,
  formatYen,
} from "../src/lib/format";
import { monthRange, shiftMonth, tryParseMonthParam } from "../src/lib/month";
import { expenseSchema, categoryNameSchema } from "../src/lib/validations";

const expense = {
  amount: "1200",
  date: "2026-09-19",
  categoryId: "category",
  subcategoryId: "",
  merchant: "",
  memo: "",
};

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
    assert.equal(expenseSchema.safeParse({ ...expense, date }).success, false);
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
test("amounts must fit PostgreSQL integer storage", () => {
  for (const amount of ["", "0", "-1", "1.5", "Infinity", "2147483648"])
    assert.equal(
      expenseSchema.safeParse({ ...expense, amount }).success,
      false,
    );
  assert.equal(
    expenseSchema.safeParse({ ...expense, amount: "2147483647" }).success,
    true,
  );
});
test("optional fields normalize whitespace and empty values", () => {
  const parsed = expenseSchema.parse({
    ...expense,
    merchant: "  shop  ",
    memo: "  ",
  });
  assert.equal(parsed.merchant, "shop");
  assert.equal(parsed.memo, null);
  assert.equal(parsed.subcategoryId, null);
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
