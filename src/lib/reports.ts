import {
  dateInputToUtc,
  jstParts,
  jstStartOfDay,
  toDateInputValue,
} from "@/lib/format";
import {
  formatMonthParam,
  monthRange,
  shiftMonth,
  type MonthParam,
} from "@/lib/month";
import { prisma } from "@/lib/prisma";

type AnnualDay = {
  date: Date | string;
  total: number;
  items: {
    amount: number;
    categoryId: string;
    category: { name: string };
    tags: { tagId: string; tag: { name: string; color: string } }[];
  }[];
};

type FixedReportItem = {
  month: string;
  amount: number;
  categoryId: string;
  category: { name: string };
};

type DatedAmount = { date: Date | string; amount: number };

type AnnualReportInput = {
  days: AnnualDay[];
  fixed: FixedReportItem[];
  incomes: DatedAmount[];
  yearAgoDays: { total: number }[];
  yearAgoFixed: { amount: number }[];
  yearAgoIncomes: { amount: number }[];
};

export function buildAnnualReport(
  endMonth: MonthParam,
  input: AnnualReportInput,
) {
  const months = Array.from({ length: 12 }, (_, index) =>
    shiftMonth(endMonth, index - 11),
  );
  const rows = months.map((month) => ({
    period: formatMonthParam(month),
    label: `${month.month}月`,
    income: 0,
    expense: 0,
    balance: 0,
  }));
  const byPeriod = new Map(rows.map((row) => [row.period, row]));

  for (const day of input.days) {
    const parts = jstParts(day.date);
    const row = byPeriod.get(
      formatMonthParam({ year: parts.year, month: parts.month }),
    );
    if (row) row.expense += day.total;
  }
  for (const item of input.fixed) {
    const row = byPeriod.get(item.month);
    if (row) row.expense += item.amount;
  }
  for (const income of input.incomes) {
    const parts = jstParts(income.date);
    const row = byPeriod.get(
      formatMonthParam({ year: parts.year, month: parts.month }),
    );
    if (row) row.income += income.amount;
  }
  for (const row of rows) row.balance = row.income - row.expense;

  const categories = new Map<string, { name: string; total: number }>();
  const tags = new Map<
    string,
    { name: string; color: string; total: number }
  >();
  for (const day of input.days) {
    for (const item of day.items) {
      const category = categories.get(item.categoryId) ?? {
        name: item.category.name,
        total: 0,
      };
      category.total += item.amount;
      categories.set(item.categoryId, category);

      for (const link of item.tags) {
        const tag = tags.get(link.tagId) ?? {
          name: link.tag.name,
          color: link.tag.color,
          total: 0,
        };
        tag.total += item.amount;
        tags.set(link.tagId, tag);
      }
    }
  }
  for (const item of input.fixed) {
    const category = categories.get(item.categoryId) ?? {
      name: item.category.name,
      total: 0,
    };
    category.total += item.amount;
    categories.set(item.categoryId, category);
  }

  const current = rows.at(-1)!;
  const previousYear = {
    income: input.yearAgoIncomes.reduce((sum, item) => sum + item.amount, 0),
    expense:
      input.yearAgoDays.reduce((sum, day) => sum + day.total, 0) +
      input.yearAgoFixed.reduce((sum, item) => sum + item.amount, 0),
  };

  return {
    rows,
    averageIncome: Math.round(
      rows.reduce((sum, row) => sum + row.income, 0) / 12,
    ),
    averageExpense: Math.round(
      rows.reduce((sum, row) => sum + row.expense, 0) / 12,
    ),
    highest: [...rows].sort((a, b) => b.expense - a.expense)[0],
    categories: [...categories.values()]
      .sort((a, b) => b.total - a.total)
      .map((category) => ({
        ...category,
        average: Math.round(category.total / 12),
      })),
    tags: [...tags.values()].sort((a, b) => b.total - a.total),
    yoy: {
      income: current.income - previousYear.income,
      expense: current.expense - previousYear.expense,
      balance:
        current.balance - (previousYear.income - previousYear.expense),
    },
    yearAgo: shiftMonth(endMonth, -12),
  };
}

export async function getAnnualReport(endMonth: MonthParam) {
  const months = Array.from({ length: 12 }, (_, index) =>
    shiftMonth(endMonth, index - 11),
  );
  const periods = months.map(formatMonthParam);
  const start = monthRange(months[0]).start;
  const end = monthRange(shiftMonth(endMonth, 1)).start;
  const yearAgo = shiftMonth(endMonth, -12);
  const yearAgoRange = monthRange(yearAgo);
  const [days, fixed, incomes, yearAgoDays, yearAgoFixed, yearAgoIncomes] =
    await Promise.all([
      prisma.dailyExpense.findMany({
        where: { date: { gte: start, lt: end } },
        include: {
          items: {
            include: {
              category: true,
              tags: { include: { tag: true } },
            },
          },
        },
      }),
      prisma.fixedExpense.findMany({
        where: { month: { in: periods } },
        include: { category: true },
      }),
      prisma.income.findMany({ where: { date: { gte: start, lt: end } } }),
      prisma.dailyExpense.findMany({
        where: { date: { gte: yearAgoRange.start, lt: yearAgoRange.end } },
      }),
      prisma.fixedExpense.findMany({
        where: { month: formatMonthParam(yearAgo) },
      }),
      prisma.income.findMany({
        where: { date: { gte: yearAgoRange.start, lt: yearAgoRange.end } },
      }),
    ]);

  return buildAnnualReport(endMonth, {
    days,
    fixed,
    incomes,
    yearAgoDays,
    yearAgoFixed,
    yearAgoIncomes,
  });
}

type WeeklyDay = {
  date: Date | string;
  total: number;
  items: {
    amount: number;
    categoryId: string;
    category: { name: string };
  }[];
};

export function buildWeeklyReport(
  start: Date,
  days: WeeklyDay[],
  incomes: DatedAmount[],
) {
  const end = new Date(start.getTime() + 7 * 86_400_000);
  const labels = ["月", "火", "水", "木", "金", "土", "日"];
  const rows = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * 86_400_000);
    return {
      date: toDateInputValue(date),
      label: labels[index],
      expense: 0,
      income: 0,
    };
  });
  const byDate = new Map(rows.map((row) => [row.date, row]));

  for (const day of days) {
    const row = byDate.get(toDateInputValue(day.date));
    if (row) row.expense += day.total;
  }
  for (const income of incomes) {
    const row = byDate.get(toDateInputValue(income.date));
    if (row) row.income += income.amount;
  }

  const categories = new Map<string, { name: string; total: number }>();
  for (const day of days) {
    for (const item of day.items) {
      const category = categories.get(item.categoryId) ?? {
        name: item.category.name,
        total: 0,
      };
      category.total += item.amount;
      categories.set(item.categoryId, category);
    }
  }

  return {
    rows,
    start: toDateInputValue(start),
    end: toDateInputValue(new Date(end.getTime() - 86_400_000)),
    income: rows.reduce((sum, row) => sum + row.income, 0),
    expense: rows.reduce((sum, row) => sum + row.expense, 0),
    categories: [...categories.values()].sort((a, b) => b.total - a.total),
  };
}

export async function getWeeklyReport(dateValue?: string) {
  const requested = dateValue ? dateInputToUtc(dateValue) : null;
  const base = requested ?? new Date();
  const parts = jstParts(base);
  const weekday = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day),
  ).getUTCDay();
  const offset = (weekday + 6) % 7;
  const start = jstStartOfDay(
    parts.year,
    parts.month,
    parts.day - offset,
  );
  const end = new Date(start.getTime() + 7 * 86_400_000);
  const [days, incomes] = await Promise.all([
    prisma.dailyExpense.findMany({
      where: { date: { gte: start, lt: end } },
      include: { items: { include: { category: true } } },
    }),
    prisma.income.findMany({ where: { date: { gte: start, lt: end } } }),
  ]);

  return buildWeeklyReport(start, days, incomes);
}
