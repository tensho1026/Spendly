import { jstParts } from "@/lib/format";
import type { MonthParam } from "@/lib/month";

export type CategorySpend = { categoryId: string; name: string; amount: number };

export function combineCategorySpend(
  daily: CategorySpend[],
  fixed: CategorySpend[],
): CategorySpend[] {
  const rows = new Map<string, CategorySpend>();
  for (const item of [...daily, ...fixed]) {
    const row = rows.get(item.categoryId) ?? { ...item, amount: 0 };
    row.amount += item.amount;
    rows.set(item.categoryId, row);
  }
  return [...rows.values()].sort((a, b) => b.amount - a.amount);
}

export function buildCalendarDays(
  month: MonthParam,
  days: { id: string; date: Date | string; total: number; itemTotal: number }[],
  today: Date = new Date(),
) {
  const count = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(month.year, month.month - 1, 1)).getUTCDay();
  const leading = (firstWeekday + 6) % 7;
  const byDay = new Map(days.map((entry) => [jstParts(entry.date).day, entry]));
  const now = jstParts(today);
  const cells: ({ day: number; date: string; status: "missing" | "matched" | "mismatch" | "future"; id?: string; total?: number } | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= count; day++) {
    const record = byDay.get(day);
    const date = `${month.year}-${String(month.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const future = month.year > now.year || (month.year === now.year && (month.month > now.month || (month.month === now.month && day > now.day)));
    cells.push(record ? { day, date, id: record.id, total: record.total, status: record.total === record.itemTotal ? "matched" : "mismatch" } : { day, date, status: future ? "future" : "missing" });
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function percentage(used: number, budget: number) {
  if (budget <= 0) return 0;
  return Math.round((used / budget) * 100);
}
