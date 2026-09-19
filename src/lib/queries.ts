import type { Category, Expense, Prisma, Subcategory } from "@prisma/client";

import { dateInputToUtc } from "@/lib/format";
import { monthRange, tryParseMonthParam, type MonthParam } from "@/lib/month";
import { prisma } from "@/lib/prisma";

export type ExpenseWithRelations = Expense & {
  category: Category;
  subcategory: Subcategory | null;
};

export type CategoryWithSub = Category & {
  subcategories: Subcategory[];
};

export type ExpenseFilters = {
  /** "2026-09" */
  month?: string;
  /** "YYYY-MM-DD" */
  from?: string;
  /** "YYYY-MM-DD"（この日を含む） */
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  categoryId?: string;
  subcategoryId?: string;
  /** 部分一致・大文字小文字無視 */
  merchant?: string;
  /** merchant または memo に部分一致 */
  keyword?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const EXPENSE_INCLUDE = {
  category: true,
  subcategory: true,
} satisfies Prisma.ExpenseInclude;

const EXPENSE_ORDER_BY: Prisma.ExpenseOrderByWithRelationInput[] = [
  { date: "desc" },
  { createdAt: "desc" },
];

const CATEGORY_ORDER_BY: Prisma.CategoryOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { name: "asc" },
];

const SUBCATEGORY_ORDER_BY: Prisma.SubcategoryOrderByWithRelationInput[] = [
  { sortOrder: "asc" },
  { name: "asc" },
];

/**
 * from / to が指定されていればそちらを優先し、なければ month を使う。
 * to はその日を含めたいので、翌日の 00:00(JST) 未満として扱う。
 */
function resolveDateFilter(
  filters: ExpenseFilters,
): Prisma.DateTimeFilter | undefined {
  const from = filters.from ? dateInputToUtc(filters.from) : null;
  const to = filters.to ? dateInputToUtc(filters.to) : null;

  if (from || to) {
    const range: Prisma.DateTimeFilter = {};

    if (from) {
      range.gte = from;
    }
    if (to) {
      range.lt = new Date(to.getTime() + DAY_MS);
    }

    return range;
  }

  const month = tryParseMonthParam(filters.month);

  if (!month) {
    return undefined;
  }

  const { start, end } = monthRange(month);
  return { gte: start, lt: end };
}

function buildExpenseWhere(filters: ExpenseFilters): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};

  const date = resolveDateFilter(filters);
  if (date) {
    where.date = date;
  }

  const amount: Prisma.IntFilter = {};
  if (
    typeof filters.minAmount === "number" &&
    Number.isSafeInteger(filters.minAmount) &&
    filters.minAmount >= 0 &&
    filters.minAmount <= 2147483647
  ) {
    amount.gte = Math.trunc(filters.minAmount);
  }
  if (
    typeof filters.maxAmount === "number" &&
    Number.isSafeInteger(filters.maxAmount) &&
    filters.maxAmount >= 0 &&
    filters.maxAmount <= 2147483647
  ) {
    amount.lte = Math.trunc(filters.maxAmount);
  }
  if (Object.keys(amount).length > 0) {
    where.amount = amount;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.subcategoryId) {
    where.subcategoryId = filters.subcategoryId;
  }

  const merchant = filters.merchant?.trim();
  if (merchant) {
    where.merchant = { contains: merchant, mode: "insensitive" };
  }

  const keyword = filters.keyword?.trim();
  if (keyword) {
    where.OR = [
      { merchant: { contains: keyword, mode: "insensitive" } },
      { memo: { contains: keyword, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function getCategoriesWithSub(): Promise<CategoryWithSub[]> {
  return prisma.category.findMany({
    orderBy: CATEGORY_ORDER_BY,
    include: {
      subcategories: { orderBy: SUBCATEGORY_ORDER_BY },
    },
  });
}

export async function getExpenses(
  filters: ExpenseFilters = {},
): Promise<ExpenseWithRelations[]> {
  return prisma.expense.findMany({
    where: buildExpenseWhere(filters),
    include: EXPENSE_INCLUDE,
    orderBy: EXPENSE_ORDER_BY,
  });
}

export async function getExpenseById(
  id: string,
): Promise<ExpenseWithRelations | null> {
  if (!id) {
    return null;
  }

  return prisma.expense.findUnique({
    where: { id },
    include: EXPENSE_INCLUDE,
  });
}

export async function getMonthlyTotal(m: MonthParam): Promise<number> {
  const { start, end } = monthRange(m);

  const result = await prisma.expense.aggregate({
    where: { date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

export async function getCategoryBreakdown(
  m: MonthParam,
): Promise<{ categoryId: string; name: string; total: number }[]> {
  const { start, end } = monthRange(m);

  const grouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  if (grouped.length === 0) {
    return [];
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((row) => row.categoryId) } },
    select: { id: true, name: true },
  });

  const nameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return grouped
    .map((row) => ({
      categoryId: row.categoryId,
      name: nameById.get(row.categoryId) ?? "不明なカテゴリ",
      total: row._sum.amount ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getSubcategoryBreakdown(
  m: MonthParam,
  categoryId: string,
): Promise<{ subcategoryId: string | null; name: string; total: number }[]> {
  const { start, end } = monthRange(m);

  const grouped = await prisma.expense.groupBy({
    by: ["subcategoryId"],
    where: { categoryId, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  if (grouped.length === 0) {
    return [];
  }

  const ids = grouped
    .map((row) => row.subcategoryId)
    .filter((id): id is string => typeof id === "string");

  const subcategories =
    ids.length > 0
      ? await prisma.subcategory.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true },
        })
      : [];

  const nameById = new Map(
    subcategories.map((subcategory) => [subcategory.id, subcategory.name]),
  );

  return grouped
    .map((row) => ({
      subcategoryId: row.subcategoryId,
      name:
        row.subcategoryId === null
          ? "未分類"
          : (nameById.get(row.subcategoryId) ?? "未分類"),
      total: row._sum.amount ?? 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getRecentExpenses(
  m: MonthParam,
  limit = 5,
): Promise<ExpenseWithRelations[]> {
  const { start, end } = monthRange(m);

  return prisma.expense.findMany({
    where: { date: { gte: start, lt: end } },
    include: EXPENSE_INCLUDE,
    orderBy: EXPENSE_ORDER_BY,
    take: limit,
  });
}

export async function getMonthlyExpenses(
  m: MonthParam,
): Promise<ExpenseWithRelations[]> {
  const { start, end } = monthRange(m);

  return prisma.expense.findMany({
    where: { date: { gte: start, lt: end } },
    include: EXPENSE_INCLUDE,
    orderBy: EXPENSE_ORDER_BY,
  });
}
