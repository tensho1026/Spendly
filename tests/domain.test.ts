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
import { savingsRate } from "../src/lib/cashflow";
import { buildNotifications } from "../src/lib/notifications";
import { missingRecurringRules } from "../src/lib/recurring";
import { buildAnnualReport, buildWeeklyReport } from "../src/lib/reports";
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
  incomeSchema,
  recurringFixedSchema,
  tagSchema,
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

test("income and recurring fixed rules validate their money and dates", () => {
  assert.equal(incomeSchema.safeParse({ date: "2026-09-19", type: "salary", amount: "250000", memo: "給与" }).success, true);
  assert.equal(incomeSchema.safeParse({ date: "bad", type: "salary", amount: "250000", memo: "" }).success, false);
  assert.equal(recurringFixedSchema.safeParse({ categoryId: "living", amount: "80000", memo: "家賃", dueDay: "25", startMonth: "2026-09", active: true }).success, true);
  assert.equal(recurringFixedSchema.safeParse({ categoryId: "living", amount: "80000", memo: "家賃", dueDay: "32", startMonth: "2026-09", active: true }).success, false);
});

test("savings rate handles surplus, deficit and months without income", () => {
  assert.equal(savingsRate(300000, 240000), 20);
  assert.equal(savingsRate(200000, 250000), -25);
  assert.equal(savingsRate(0, 10000), null);
});
test("custom tags validate names and supported colors", () => {
  assert.equal(tagSchema.safeParse({ name: " 旅行 ", color: "blue" }).success, true);
  assert.equal(tagSchema.safeParse({ name: "", color: "blue" }).success, false);
  assert.equal(tagSchema.safeParse({ name: "旅行", color: "rainbow" }).success, false);
  const tagged = dailySchema.parse({ date: "2026-09-19", total: "1000", items: [{ ...row, tagIds: ["trip", "family"] }] });
  assert.deepEqual(tagged.items[0].tagIds, ["trip", "family"]);
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

test("recurring generation includes active rules that were enabled later", () => {
  const rules = [
    { id: "existing", amount: 1000 },
    { id: "enabled-later", amount: 2000 },
  ];
  assert.deepEqual(missingRecurringRules(rules, ["existing"]), [rules[1]]);
});

test("annual reports preserve monthly, category, tag and year-over-year totals", () => {
  const report = buildAnnualReport(
    { year: 2026, month: 9 },
    {
      days: [
        {
          date: "2026-09-18T15:00:00.000Z",
          total: 3000,
          items: [
            {
              amount: 2500,
              categoryId: "food",
              category: { name: "食費" },
              tags: [
                { tagId: "trip", tag: { name: "旅行", color: "blue" } },
              ],
            },
          ],
        },
      ],
      fixed: [
        {
          month: "2026-09",
          amount: 80000,
          categoryId: "rent",
          category: { name: "家賃" },
        },
      ],
      incomes: [{ date: "2026-09-18T15:00:00.000Z", amount: 250000 }],
      yearAgoTotals: { income: 240000, expense: 77000 },
    },
  );

  assert.deepEqual(report.rows.at(-1), {
    period: "2026-09",
    label: "9月",
    income: 250000,
    expense: 83000,
    balance: 167000,
  });
  assert.deepEqual(report.categories.slice(0, 2), [
    { name: "家賃", total: 80000, average: 6667 },
    { name: "食費", total: 2500, average: 208 },
  ]);
  assert.deepEqual(report.tags, [
    { name: "旅行", color: "blue", total: 2500 },
  ]);
  assert.deepEqual(report.yoy, {
    income: 10000,
    expense: 6000,
    balance: 4000,
  });
});

test("weekly reports keep JST dates and aggregate category totals", () => {
  const start = new Date("2026-09-13T15:00:00.000Z");
  const report = buildWeeklyReport(
    start,
    [
      {
        date: "2026-09-14T15:00:00.000Z",
        total: 1500,
        items: [
          {
            amount: 1200,
            categoryId: "food",
            category: { name: "食費" },
          },
        ],
      },
    ],
    [{ date: "2026-09-13T15:00:00.000Z", amount: 10000 }],
  );

  assert.equal(report.start, "2026-09-14");
  assert.equal(report.end, "2026-09-20");
  assert.equal(report.rows[0].income, 10000);
  assert.equal(report.rows[1].expense, 1500);
  assert.deepEqual(report.categories, [{ name: "食費", total: 1200 }]);
});

test("notifications retain budget, missing-day and due-date thresholds", () => {
  const items = buildNotifications({
    month: { year: 2026, month: 9 },
    days: [],
    fixed: [
      {
        id: "rent",
        categoryId: "rent-category",
        amount: 900,
        memo: "家賃",
        dueDay: 22,
        category: { name: "住居費" },
      },
    ],
    budgets: [
      {
        id: "rent-budget",
        categoryId: "rent-category",
        amount: 1000,
        category: { name: "住居費" },
      },
    ],
    now: new Date("2026-09-20T03:00:00.000Z"),
  });

  assert.deepEqual(
    items.map((item) => item.id),
    ["budget-80-rent-budget", "missing-days", "fixed-rent"],
  );
});
