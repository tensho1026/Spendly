"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [yearInput, setYearInput] = useState(String(month.year));
  const pickerYear = Number(yearInput);
  const validPickerYear =
    /^\d{3,4}$/.test(yearInput) && pickerYear >= 100 && pickerYear <= 9999;
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

      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (open) setYearInput(String(month.year));
        }}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label={`${formatMonthJP(month.year, month.month)}、年月を選択`}
            className="min-w-28 gap-1 px-2 text-base font-semibold tabular-nums"
          >
            {formatMonthJP(month.year, month.month)}
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>表示する年月を選択</DialogTitle>
            <DialogDescription>
              年を入力し、移動したい月を選んでください。
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="前年へ"
              disabled={!validPickerYear || pickerYear <= 100}
              onClick={() => setYearInput(String(pickerYear - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <label htmlFor="picker-year" className="text-sm font-medium">
              年
            </label>
            <Input
              id="picker-year"
              type="number"
              min={100}
              max={9999}
              step={1}
              inputMode="numeric"
              value={yearInput}
              onChange={(event) => setYearInput(event.target.value)}
              className="w-28 text-center tabular-nums"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="翌年へ"
              disabled={!validPickerYear || pickerYear >= 9999}
              onClick={() => setYearInput(String(pickerYear + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (pickerMonth) => (
                <Button
                  key={pickerMonth}
                  type="button"
                  variant={
                    pickerYear === month.year && pickerMonth === month.month
                      ? "secondary"
                      : "outline"
                  }
                  disabled={!validPickerYear}
                  onClick={() => {
                    setPickerOpen(false);
                    navigate({ year: pickerYear, month: pickerMonth });
                  }}
                >
                  {pickerMonth}月
                </Button>
              ),
            )}
          </div>
        </DialogContent>
      </Dialog>

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
