"use client";

import { useActionState, useState } from "react";
import { saveLivingBudgetAction } from "@/app/actions/monthly-planning";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LivingBudgetForm({
  month,
  budget,
}: {
  month: string;
  budget: number | null;
}) {
  const [state, action, pending] = useActionState(
    saveLivingBudgetAction,
    initialActionState,
  );
  const [value, setValue] = useState(budget === null ? "" : String(budget));
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="month" value={month} />
      <Label htmlFor="living-budget">日々の支出に使える月間予算（円）</Label>
      <Input
        id="living-budget"
        name="livingBudget"
        type="number"
        min="0"
        max="2147483647"
        step="1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={pending}
        placeholder="例: 60000"
      />
      <p className="text-sm text-muted-foreground">
        固定費を除いた生活費の予算です。カテゴリ別予算とは独立しています。空欄で未設定、0円も設定できます。
      </p>
      {state.message && (
        <p
          role="status"
          className={state.ok ? "text-primary" : "text-destructive"}
        >
          {state.message}
        </p>
      )}
      <Button disabled={pending}>
        {pending ? "保存中…" : "生活費予算を保存"}
      </Button>
    </form>
  );
}
