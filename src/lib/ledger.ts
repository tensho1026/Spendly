import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMonthParam, monthRange, type MonthParam } from "@/lib/month";
import { sumItems } from "@/lib/ledger-validation";
import { missingRecurringRules } from "@/lib/recurring";

const dailyInclude = {
  items: {
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
};
export async function getDaily(id: string) {
  const day = await prisma.dailyExpense.findUnique({
    where: { id },
    include: dailyInclude,
  });
  if (day) return day;
  // Old bookmarked expense URLs continue to open the migrated day.
  const legacy = await prisma.expense.findUnique({
    where: { id },
    select: { dailyId: true },
  });
  return legacy?.dailyId
    ? prisma.dailyExpense.findUnique({
        where: { id: legacy.dailyId },
        include: dailyInclude,
      })
    : null;
}
function daysWhere(
  month?: MonthParam,
  filters: { categoryId?: string; keyword?: string; tagId?: string } = {},
): Prisma.DailyExpenseWhereInput {
  const range = month ? monthRange(month) : null;
  return {
    date: range ? { gte: range.start, lt: range.end } : undefined,
    items:
      filters.categoryId || filters.keyword || filters.tagId
        ? {
            some: {
              categoryId: filters.categoryId || undefined,
              memo: filters.keyword
                ? { contains: filters.keyword, mode: "insensitive" }
                : undefined,
              tags: filters.tagId ? { some: { tagId: filters.tagId } } : undefined,
            },
          }
        : undefined,
  };
}

export async function getDays(
  month?: MonthParam,
  filters: { categoryId?: string; keyword?: string; tagId?: string } = {},
) {
  return prisma.dailyExpense.findMany({
    where: daysWhere(month, filters),
    include: dailyInclude,
    orderBy: { date: "desc" },
  });
}

export async function getDashboardDays(month: MonthParam) {
  const range = monthRange(month);
  return prisma.dailyExpense.findMany({
    where: { date: { gte: range.start, lt: range.end } },
    select: {
      id: true,
      date: true,
      total: true,
      items: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          amount: true,
          categoryId: true,
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });
}

export function summarizePreviousMonthSpend(
  dailyTotal: number,
  dailyCategories: { categoryId: string; amount: number }[],
  fixed: { categoryId: string; amount: number }[],
) {
  const byCategory = new Map<string, number>();
  for (const item of [...dailyCategories, ...fixed]) {
    byCategory.set(item.categoryId, (byCategory.get(item.categoryId) ?? 0) + item.amount);
  }
  return {
    total: dailyTotal + fixed.reduce((sum, item) => sum + item.amount, 0),
    byCategory,
  };
}

export async function getPreviousMonthSpend(month: MonthParam) {
  const range = monthRange(month);
  const [days, categories, fixed] = await Promise.all([
    prisma.dailyExpense.aggregate({
      where: { date: { gte: range.start, lt: range.end } },
      _sum: { total: true },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { daily: { is: { date: { gte: range.start, lt: range.end } } } },
      _sum: { amount: true },
    }),
    prisma.fixedExpense.findMany({
      where: { month: formatMonthParam(month) },
      select: { categoryId: true, amount: true },
    }),
  ]);
  return summarizePreviousMonthSpend(
    days._sum.total ?? 0,
    categories.map((row) => ({ categoryId: row.categoryId, amount: row._sum.amount ?? 0 })),
    fixed,
  );
}

export async function getDashboardIncome(month: MonthParam) {
  const range = monthRange(month);
  const result = await prisma.income.aggregate({
    where: { date: { gte: range.start, lt: range.end } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  return { total: result._sum.amount ?? 0, count: result._count._all };
}

export const EXPENSE_PAGE_SIZE = 20;

export async function getDaysPage(
  month: MonthParam | undefined,
  filters: { categoryId?: string; keyword?: string; tagId?: string },
  page: number,
) {
  const where = daysWhere(month, filters);
  const [summary, days] = await Promise.all([
    prisma.dailyExpense.aggregate({
      where,
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.dailyExpense.findMany({
      where,
      select: {
        id: true,
        date: true,
        total: true,
        items: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            amount: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * EXPENSE_PAGE_SIZE,
      take: EXPENSE_PAGE_SIZE,
    }),
  ]);
  return {
    days,
    count: summary._count._all,
    total: summary._sum.total ?? 0,
    totalPages: Math.max(1, Math.ceil(summary._count._all / EXPENSE_PAGE_SIZE)),
  };
}
export async function getTags() {
  return prisma.tag.findMany({ orderBy: [{ name: "asc" }] });
}
export async function getFixed(month: string) {
  return prisma.fixedExpense.findMany({
    where: { month },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}
export async function ensureRecurringFixed(month: string, db = prisma) {
  const rules = await db.recurringFixedExpense.findMany({
    where: { active: true, startMonth: { lte: month } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (rules.length === 0) return;

  const existing = await db.fixedExpense.findMany({
    where: { month, recurringId: { in: rules.map((rule) => rule.id) } },
    select: { recurringId: true },
  });
  const missing = missingRecurringRules(
    rules,
    existing.map((item) => item.recurringId),
  );
  if (missing.length === 0) return;

  await db.$transaction(async (tx) => {
    await tx.fixedMonth.upsert({
      where: { month },
      create: { month },
      update: {},
    });
    await tx.fixedExpense.createMany({
      data: missing.map((rule, index) => ({
        month,
        categoryId: rule.categoryId,
        amount: rule.amount,
        memo: rule.memo,
        dueDay: rule.dueDay,
        recurringId: rule.id,
        sortOrder: index,
      })),
      skipDuplicates: true,
    });
    await tx.fixedMonth.update({ where: { month }, data: { recurringGeneratedAt: new Date() } });
  });
}
export async function getIncomes(month: MonthParam) {
  return prisma.income.findMany({
    where: { date: { gte: monthRange(month).start, lt: monthRange(month).end } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
export async function getRecurringFixed() {
  return prisma.recurringFixedExpense.findMany({
    include: { category: true },
    orderBy: [{ active: "desc" }, { dueDay: "asc" }, { createdAt: "asc" }],
  });
}
export async function getBudgets(month: string) {
  return prisma.categoryBudget.findMany({
    where: { month },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { category: { name: "asc" } }],
  });
}
export async function getTemplates() {
  return prisma.expenseTemplate.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
export type DailyRecord = NonNullable<Awaited<ReturnType<typeof getDaily>>>;
export type FixedRecord = Awaited<ReturnType<typeof getFixed>>[number];
export function summarizeDays(
  days: {
    total: number;
    items: { amount: number; categoryId: string; category: { name: string } }[];
  }[],
) {
  const grouped = new Map<
    string,
    { categoryId: string; name: string; total: number }
  >();
  for (const day of days)
    for (const item of day.items) {
      const row = grouped.get(item.categoryId) ?? {
        categoryId: item.categoryId,
        name: item.category.name,
        total: 0,
      };
      row.total += item.amount;
      grouped.set(item.categoryId, row);
    }
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const itemTotal = days.reduce((sum, day) => sum + sumItems(day.items), 0);
  return {
    total,
    itemTotal,
    difference: total - itemTotal,
    breakdown: [...grouped.values()].sort((a, b) => b.total - a.total),
  };
}
