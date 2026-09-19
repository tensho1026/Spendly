"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { saveBudgetsAction } from "@/app/actions/planning";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { month: string; categories: { id: string; name: string }[]; budgets: { categoryId: string; amount: number }[] };

export function BudgetForm({ month, categories, budgets }: Props) {
  const [state, action, pending] = useActionState(saveBudgetsAction, initialActionState);
  const initial = Object.fromEntries(budgets.map((item) => [item.categoryId, String(item.amount)]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const rows = categories.map((category) => ({ categoryId: category.id, amount: values[category.id] || "0" }));
  return <form action={action} className="space-y-5">
    <input type="hidden" name="month" value={month} />
    <input type="hidden" name="budgets" value={JSON.stringify(rows)} />
    {state.message && <p role="status" className={`rounded-lg border p-3 text-sm ${state.ok ? "bg-secondary text-primary" : "border-destructive/30 text-destructive"}`}>{state.message}</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      {categories.map((category) => <div key={category.id} className="space-y-2 rounded-xl border p-4">
        <Label htmlFor={`budget-${category.id}`}>{category.name}</Label>
        <div className="relative"><Input id={`budget-${category.id}`} inputMode="numeric" value={values[category.id] ?? ""} placeholder="0" onChange={(event) => setValues((old) => ({ ...old, [category.id]: event.target.value.replace(/[^0-9]/g, "") }))} className="pr-9" /><span className="absolute right-3 top-2.5 text-sm text-muted-foreground">円</span></div>
      </div>)}
    </div>
    <p className="text-xs text-muted-foreground">0円または空欄のカテゴリは予算未設定として扱います。</p>
    <div className="flex justify-end"><Button disabled={pending}><Save className="size-4" />{pending ? "保存中..." : "予算を保存"}</Button></div>
  </form>;
}
