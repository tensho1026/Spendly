"use client";
import { Copy } from "lucide-react";
import { copyPreviousFixedAction } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
export function CopyPreviousButton({ month, previousLabel, hasCurrent }: { month: string; previousLabel: string; hasCurrent: boolean }) {
  return <form action={copyPreviousFixedAction} onSubmit={(event) => { if (hasCurrent && !window.confirm("現在の固定費を前月の内容で置き換えます。よろしいですか？")) event.preventDefault(); }}><input type="hidden" name="month" value={month} /><Button type="submit" variant="outline"><Copy className="size-4" />{previousLabel}からコピー</Button></form>;
}
