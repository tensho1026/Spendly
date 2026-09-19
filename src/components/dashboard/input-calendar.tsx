import Link from "next/link";
import { formatYen } from "@/lib/format";
import { buildCalendarDays } from "@/lib/planning";
import type { MonthParam } from "@/lib/month";

export function InputCalendar({ month, days }: { month: MonthParam; days: { id: string; date: Date; total: number; itemTotal: number }[] }) {
  const cells = buildCalendarDays(month, days);
  const style = { matched: "border-emerald-200 bg-emerald-50", mismatch: "border-amber-300 bg-amber-50", missing: "border-rose-200 bg-rose-50", future: "border-dashed bg-muted/30" };
  return <div>
    <div className="mb-3 grid grid-cols-7 text-center text-xs text-muted-foreground">{["月","火","水","木","金","土","日"].map((day) => <span key={day}>{day}</span>)}</div>
    <div className="grid grid-cols-7 gap-1.5">{cells.map((cell, index) => cell ? <Link key={cell.date} href={cell.id ? `/expenses/${cell.id}` : `/expenses/new?date=${cell.date}`} aria-label={`${cell.date} ${cell.status}`} className={`min-h-16 rounded-lg border p-1.5 text-xs transition hover:ring-2 hover:ring-primary/30 ${style[cell.status]}`}><span className="font-semibold">{cell.day}</span>{cell.total !== undefined && <span className="mt-2 block truncate text-[10px] font-medium tabular-nums sm:text-xs">{formatYen(cell.total)}</span>}</Link> : <span key={`blank-${index}`} />)}</div>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-400" />入力済み</span><span><i className="mr-1 inline-block size-2 rounded-full bg-amber-400" />差額あり</span><span><i className="mr-1 inline-block size-2 rounded-full bg-rose-300" />未入力</span></div>
  </div>;
}
