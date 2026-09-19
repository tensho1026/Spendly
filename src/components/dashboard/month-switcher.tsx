"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMonthJP } from "@/lib/format";
import { formatMonthParam, shiftMonth, type MonthParam } from "@/lib/month";

type MonthSwitcherProps = {
  month: MonthParam;
  today: MonthParam;
  basePath?: string;
};

export function MonthSwitcher({
  month,
  today,
  basePath = "/dashboard",
}: MonthSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCurrentMonth =
    today.year === month.year && today.month === month.month;

  const navigate = (target: MonthParam) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", formatMonthParam(target));
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="前の月へ"
        onClick={() => navigate(shiftMonth(month, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <span
        className="min-w-28 text-center text-base font-semibold tabular-nums"
        aria-live="polite"
      >
        {formatMonthJP(month.year, month.month)}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="次の月へ"
        onClick={() => navigate(shiftMonth(month, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>

      {!isCurrentMonth && today ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-1 text-xs"
          onClick={() => navigate(today)}
        >
          今月
        </Button>
      ) : null}
    </div>
  );
}
