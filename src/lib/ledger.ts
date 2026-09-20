import { prisma } from "@/lib/prisma";
import { monthRange, type MonthParam } from "@/lib/month";
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
export async function getDays(
  month?: MonthParam,
  filters: { categoryId?: string; keyword?: string; tagId?: string } = {},
) {
  const range = month ? monthRange(month) : null;
  return prisma.dailyExpense.findMany({
    where: {
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
    },
    include: dailyInclude,
    orderBy: { date: "desc" },
  });
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
export async function ensureRecurringFixed(month: string) {
  await prisma.$transaction(async (tx) => {
    await tx.fixedMonth.upsert({
      where: { month },
      create: { month },
      update: {},
    });
    const rules = await tx.recurringFixedExpense.findMany({
      where: {
        active: true,
        startMonth: { lte: month },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (rules.length) {
      const existing = await tx.fixedExpense.findMany({
        where: { month, recurringId: { in: rules.map((rule) => rule.id) } },
        select: { recurringId: true },
      });
      await tx.fixedExpense.createMany({
        data: missingRecurringRules(
          rules,
          existing.map((item) => item.recurringId),
        )
          .map((rule, index) => ({
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
    }
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
