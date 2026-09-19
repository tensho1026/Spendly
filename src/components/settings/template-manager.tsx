"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { deleteTemplateAction, saveTemplateAction } from "@/app/actions/planning";
import { initialActionState } from "@/lib/action-state";
import { formatYen } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

type Template = { id: string; categoryId: string; amount: number; memo: string | null; category: { name: string } };
function TemplateRow({ template, categories }: { template: Template; categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveTemplateAction, initialActionState);
  return <li className="p-4"><form action={action} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1.5fr_auto]"><input type="hidden" name="id" value={template.id} /><div className="space-y-1"><Label>カテゴリ</Label><NativeSelect name="categoryId" defaultValue={template.categoryId}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</NativeSelect></div><div className="space-y-1"><Label>金額</Label><Input name="amount" defaultValue={template.amount} inputMode="numeric" /></div><div className="space-y-1"><Label>メモ</Label><Input name="memo" defaultValue={template.memo ?? ""} maxLength={500} /></div><Button variant="outline" size="sm" disabled={pending}><Save className="size-4" />更新</Button>{state.message && <p role="status" className={`sm:col-span-4 text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>}</form><div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{template.category.name} · {formatYen(template.amount)}</span><form action={deleteTemplateAction}><input type="hidden" name="id" value={template.id} /><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="size-4" />削除</Button></form></div></li>;
}
export function TemplateManager({ categories, templates }: { categories: { id: string; name: string }[]; templates: Template[] }) {
  const [state, action, pending] = useActionState(saveTemplateAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state]);
  return <div className="space-y-6">
    <form ref={formRef} action={action} className="grid items-end gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2"><Label htmlFor="template-category">カテゴリ</Label><NativeSelect id="template-category" name="categoryId" required><option value="">選択してください</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="template-amount">金額（円）</Label><Input id="template-amount" name="amount" inputMode="numeric" required placeholder="1000" /></div>
      <div className="space-y-2"><Label htmlFor="template-memo">メモ</Label><Input id="template-memo" name="memo" maxLength={500} placeholder="例: 昼食" /></div>
      <Button disabled={pending || categories.length === 0}><Plus className="size-4" />{pending ? "追加中..." : "テンプレートを追加"}</Button>
      {state.message && <p role="status" className={`sm:col-span-2 lg:col-span-4 text-sm ${state.ok ? "text-primary" : "text-destructive"}`}>{state.message}</p>}
    </form>
    {templates.length ? <ul className="divide-y rounded-xl border">{templates.map((template) => <TemplateRow key={template.id} template={template} categories={categories} />)}</ul> : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">テンプレートはまだありません。</p>}
  </div>;
}
