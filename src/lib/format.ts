/**
 * 表示・保存はすべて JST(UTC+9, サマータイムなし) 基準で扱う。
 * DB には UTC で入るため、日付の見た目が 1 日ずれないよう
 * ここでオフセットを足し引きしてから年月日を取り出す。
 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type DateParts = { year: number; month: number; day: number };

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** UTC の Date を JST の年月日に分解する。 */
export function jstParts(value: Date | string): DateParts {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return { year: NaN, month: NaN, day: NaN };
  }

  const shifted = new Date(date.getTime() + JST_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** JST のその日の 00:00 を表す UTC の Date を作る（month は 1-12）。 */
export function jstStartOfDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
}

/** "YYYY-MM-DD" を JST の 00:00 相当の UTC Date に変換する。不正な値は null。 */
export function dateInputToUtc(value: string): Date | null {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!matched) {
    return null;
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const date = jstStartOfDay(year, month, day);
  const parts = jstParts(date);

  // 2026-02-31 のような繰り上がる日付を弾く。
  if (parts.year !== year || parts.month !== month || parts.day !== day) {
    return null;
  }

  return date;
}

/** 52430 → "¥52,430" */
export function formatYen(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "¥0";
  }

  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";

  return `${sign}¥${Math.abs(rounded).toLocaleString("ja-JP")}`;
}

/** 2026-09-17 → "2026年9月17日" */
export function formatDateJP(date: Date | string): string {
  const { year, month, day } = jstParts(date);

  if (Number.isNaN(year)) {
    return "";
  }

  return `${year}年${month}月${day}日`;
}

/** (2026, 9) → "2026年9月" */
export function formatMonthJP(year: number, month: number): string {
  return `${year}年${month}月`;
}

/** 2026-09-17 → "9/17" */
export function formatShortDate(date: Date | string): string {
  const { month, day } = jstParts(date);

  if (Number.isNaN(month)) {
    return "";
  }

  return `${month}/${day}`;
}

/** `<input type="date">` に渡せる "YYYY-MM-DD" を返す。 */
export function toDateInputValue(date: Date | string): string {
  const { year, month, day } = jstParts(date);

  if (Number.isNaN(year)) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
