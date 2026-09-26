import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMonthParam, monthRange, type MonthParam } from "@/lib/month";
import { monthlyProgress } from "@/lib/monthly-planning";

export async function getMonthlyReview(
  month: MonthParam,
  db: Prisma.TransactionClient = prisma,
) {
  const period = formatMonthParam(month);
  const range = monthRange(month);
  const date = { gte: range.start, lt: range.end };
  const [plan, days, income, fixed, budgets] = await Promise.all([
    db.monthlyPlan.findUnique({ where: { month: period } }),
    db.dailyExpense.findMany({
      where: { date },
      orderBy: { date: "asc" },
      include: {
        items: {
          orderBy: { id: "asc" },
          include: { tags: { orderBy: { tagId: "asc" } } },
        },
      },
    }),
    db.income.findMany({ where: { date }, orderBy: { id: "asc" } }),
    db.fixedExpense.findMany({
      where: { month: period },
      orderBy: { id: "asc" },
    }),
    db.categoryBudget.findMany({
      where: { month: period },
      orderBy: { id: "asc" },
    }),
  ]);
  const progress = monthlyProgress(month, days, plan?.livingBudget ?? null);
  const incomeTotal = income.reduce((sum, item) => sum + item.amount, 0);
  const fixedTotal = fixed.reduce((sum, item) => sum + item.amount, 0);
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        days,
        income,
        fixed,
        budgets,
        livingBudget: plan?.livingBudget ?? null,
      }),
    )
    .digest("hex");
  return {
    plan,
    days,
    progress,
    incomeTotal,
    fixedTotal,
    fingerprint,
    changedSinceClose:
      !!plan?.closedAt && plan.closedFingerprint !== fingerprint,
  };
}
