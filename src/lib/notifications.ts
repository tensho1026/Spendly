import { cache } from "react";
import { jstParts } from "@/lib/format";
import { summarizeDays } from "@/lib/ledger";
import { currentMonth, formatMonthParam, monthRange, type MonthParam } from "@/lib/month";
import { combineCategorySpend, percentage } from "@/lib/planning";
import { prisma } from "@/lib/prisma";

export type AppNotification = {
  id: string;
  level: "info" | "warning" | "danger";
  title: string;
  description: string;
  href: string;
};

type NotificationDay = {
  date: Date | string;
  total: number;
  items: {
    amount: number;
    categoryId: string;
    category: { name: string };
  }[];
};

type NotificationFixed = {
  id: string;
  categoryId: string;
  amount: number;
  memo: string | null;
  dueDay: number | null;
  category: { name: string };
};

type NotificationBudget = {
  id: string;
  categoryId: string;
  amount: number;
  category: { name: string };
};

export function buildNotifications({
  month,
  days,
  fixed,
  budgets,
  now = new Date(),
}: {
  month: MonthParam;
  days: NotificationDay[];
  fixed: NotificationFixed[];
  budgets: NotificationBudget[];
  now?: Date;
}): AppNotification[] {
  const period = formatMonthParam(month);
  const summary = summarizeDays(days);
  const spend = combineCategorySpend(
    summary.breakdown.map((item) => ({
      categoryId: item.categoryId,
      name: item.name,
      amount: item.total,
    })),
    fixed.map((item) => ({
      categoryId: item.categoryId,
      name: item.category.name,
      amount: item.amount,
    })),
  );
  const used = new Map(spend.map((item) => [item.categoryId, item.amount]));
  const result: AppNotification[] = [];

  for (const budget of budgets) {
    const amount = used.get(budget.categoryId) ?? 0;
    const ratio = percentage(amount, budget.amount);
    if (ratio >= 100) {
      result.push({
        id: `budget-over-${budget.id}`,
        level: "danger",
        title: `${budget.category.name}の予算を超過`,
        description: `${ratio}%使用・${amount - budget.amount}円超過しています。`,
        href: `/budgets?month=${period}`,
      });
    } else if (ratio >= 80) {
      result.push({
        id: `budget-80-${budget.id}`,
        level: "warning",
        title: `${budget.category.name}の予算が80%を超えました`,
        description: `${ratio}%使用・残り${budget.amount - amount}円です。`,
        href: `/budgets?month=${period}`,
      });
    }
  }

  const today = jstParts(now);
  const isCurrentMonth =
    today.year === month.year && today.month === month.month;
  if (!isCurrentMonth) return result;

  const recorded = new Set(days.map((day) => jstParts(day.date).day));
  const start = Math.max(1, today.day - 2);
  const missing = [];
  for (let day = start; day <= today.day; day++) {
    if (!recorded.has(day)) missing.push(day);
  }
  if (missing.length === today.day - start + 1 && missing.length >= 3) {
    result.push({
      id: "missing-days",
      level: "warning",
      title: "3日間、支出が未入力です",
      description: `${month.month}/${start}〜${month.month}/${today.day}の記録を確認しましょう。`,
      href: "/expenses/new",
    });
  }

  for (const item of fixed) {
    if (
      item.dueDay &&
      item.dueDay >= today.day &&
      item.dueDay <= today.day + 3
    ) {
      result.push({
        id: `fixed-${item.id}`,
        level: "info",
        title: `${item.memo || item.category.name}の支払日が近づいています`,
        description: `${month.month}月${item.dueDay}日・${item.amount.toLocaleString("ja-JP")}円`,
        href: `/fixed-expenses?month=${period}`,
      });
    }
  }

  return result;
}

export const getNotifications = cache(async function getNotifications(
  month: MonthParam = currentMonth(),
): Promise<AppNotification[]> {
  const period = formatMonthParam(month);
  const range = monthRange(month);
  const [days, fixed, budgets] = await Promise.all([
    prisma.dailyExpense.findMany({
      where: { date: { gte: range.start, lt: range.end } },
      select: {
        date: true,
        total: true,
        items: {
          select: {
            amount: true,
            categoryId: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.fixedExpense.findMany({
      where: { month: period },
      select: {
        id: true,
        categoryId: true,
        amount: true,
        memo: true,
        dueDay: true,
        category: { select: { name: true } },
      },
    }),
    prisma.categoryBudget.findMany({
      where: { month: period },
      select: {
        id: true,
        categoryId: true,
        amount: true,
        category: { select: { name: true } },
      },
    }),
  ]);
  return buildNotifications({ month, days, fixed, budgets });
});
