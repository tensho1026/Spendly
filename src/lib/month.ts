import { jstParts, jstStartOfDay } from "@/lib/format";

/** month は 1-12。 */
export type MonthParam = { year: number; month: number };

const MONTH_PARAM_PATTERN = /^(\d{4})-(\d{2})$/;

/** JST での今月。 */
export function currentMonth(): MonthParam {
  const { year, month } = jstParts(new Date());
  return { year, month };
}

/** "2026-09" を解釈する。形式が不正なら今月を返す。 */
export function parseMonthParam(value?: string | null): MonthParam {
  const parsed = tryParseMonthParam(value);
  return parsed ?? currentMonth();
}

/** "2026-09" を解釈する。形式が不正なら null（フィルタなど、既定値を当てたくない場面で使う）。 */
export function tryParseMonthParam(value?: string | null): MonthParam | null {
  const matched = value ? MONTH_PARAM_PATTERN.exec(value.trim()) : null;

  if (!matched) {
    return null;
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);

  if (year < 100 || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

/** { year: 2026, month: 9 } → "2026-09" */
export function formatMonthParam(m: MonthParam): string {
  return `${String(m.year).padStart(4, "0")}-${String(m.month).padStart(2, "0")}`;
}

/** 月を delta か月ずらす（年をまたぐ場合も正規化する）。 */
export function shiftMonth(m: MonthParam, delta: number): MonthParam {
  const zeroBased = m.year * 12 + (m.month - 1) + delta;

  return {
    year: Math.floor(zeroBased / 12),
    month: (((zeroBased % 12) + 12) % 12) + 1,
  };
}

/** JST の月初〜翌月初を表す UTC の Date。start 以上 end 未満で使う。 */
export function monthRange(m: MonthParam): { start: Date; end: Date } {
  const next = shiftMonth(m, 1);

  return {
    start: jstStartOfDay(m.year, m.month, 1),
    end: jstStartOfDay(next.year, next.month, 1),
  };
}
