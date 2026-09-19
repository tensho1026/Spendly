/**
 * グラフと内訳リストで共通して使うカテゴリ配色。
 * 並び順（インデックス）に対して常に同じ色を返す。
 */
export const CHART_COLORS = [
  "#2563eb",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#ef4444",
  "#0ea5e9",
  "#eab308",
  "#ec4899",
];

export function colorForIndex(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
