"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { deleteIncomeAction, saveIncomeAction } from "@/app/actions/cashflow";
import { initialActionState } from "@/lib/action-state";
import { formatYen, toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

const types = { salary: "給料", bonus: "賞与", extra: "臨時収入" } as const;
type Income = { id: string; date: Date; type: string; amount: number; memo: string | null };

function IncomeRow({ income }: { income: Income }) {
  const [state, action, pending] = useActionState(saveIncomeAction, initialActionState);
  return <li className="p-4"><form action={action} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto]"><input type="hidden" name="id" value={income.id} /><div className="space-y-1"><Label>日付</Label><Input name="date" type="date" defaultValue={toDateInputValue(income.date)} required /></div><div className="space-y-1"><Label>種類</Label><NativeSelect name="type" defaultValue={income.type}>{Object.entries(types).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></div><div className="space-y-1"><Label>金額</Label><Input name="amount" inputMode="numeric" defaultValue={income.amount} required /></div><div className="space-y-1"><Label>メモ</Label><Input name="memo" defaultValue={income.memo ?? ""} maxLength={500} /></div><Button variant="outline" size="sm" disabled={pending}><Save className="size-4" />更新</Button>{state.message && <p role="status" className={`sm:col-span-2 lg:col-span-5 text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>}</form><div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{types[income.type as keyof typeof types] ?? "収入"} · {formatYen(income.amount)}</span><form action={deleteIncomeAction}><input type="hidden" name="id" value={income.id} /><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="size-4" />削除</Button></form></div></li>;
}

export function IncomeManager({ incomes, defaultDate }: { incomes: Income[]; defaultDate: string }) {
  const [state, action, pending] = useActionState(saveIncomeAction, initialActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return <div className="space-y-6"><form ref={ref} action={action} className="grid items-end gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5"><div className="space-y-2"><Label htmlFor="income-date">日付</Label><Input id="income-date" name="date" type="date" defaultValue={defaultDate} required /></div><div className="space-y-2"><Label htmlFor="income-type">種類</Label><NativeSelect id="income-type" name="type" defaultValue="salary">{Object.entries(types).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="income-amount">金額（円）</Label><Input id="income-amount" name="amount" inputMode="numeric" placeholder="250000" required /></div><div className="space-y-2"><Label htmlFor="income-memo">メモ</Label><Input id="income-memo" name="memo" maxLength={500} placeholder="例: 9月分給与" /></div><Button disabled={pending}><Plus className="size-4" />{pending ? "登録中..." : "収入を登録"}</Button>{state.message && <p role="status" className={`sm:col-span-2 lg:col-span-5 text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>}</form>{incomes.length ? <ul className="divide-y rounded-xl border">{incomes.map((income) => <IncomeRow key={income.id} income={income} />)}</ul> : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">この月の収入はまだありません。</p>}</div>;
}
