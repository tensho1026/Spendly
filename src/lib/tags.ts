export const TAG_COLORS = ["slate", "blue", "emerald", "amber", "rose", "violet"] as const;
export const tagColorClass: Record<(typeof TAG_COLORS)[number], string> = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};
export function colorClass(color: string) { return tagColorClass[color as keyof typeof tagColorClass] ?? tagColorClass.slate; }
