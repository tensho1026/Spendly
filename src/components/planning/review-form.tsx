"use client";

import { useActionState, useState } from "react";
import { saveMonthlyReviewAction } from "@/app/actions/monthly-planning";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({
  month,
  reflection,
  closed,
  canClose,
  fingerprint,
}: {
  month: string;
  reflection: string;
  closed: boolean;
  canClose: boolean;
  fingerprint: string;
}) {
  const [state, action, pending] = useActionState(
    saveMonthlyReviewAction,
    initialActionState,
  );
  const [memo, setMemo] = useState(reflection);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="fingerprint" value={fingerprint} />
      <fieldset disabled={pending} className="space-y-4">
        <Label htmlFor="reflection">今月の振り返り</Label>
        <Textarea
          id="reflection"
          name="reflection"
          maxLength={3000}
          rows={6}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="よかった買い物、出費が増えた理由、来月に意識したいこと…"
        />
        <p className="text-xs text-muted-foreground">
          {memo.length} / 3000文字。月締め前でもメモを保存できます。
        </p>
        {!closed && canClose && (
          <label className="flex items-start gap-3 rounded-lg border p-4 text-sm">
            <input type="checkbox" name="acknowledged" className="mt-1" />
            入力漏れ・内訳の差額・収入・固定費を確認しました。未入力や差額がある場合も、その状態で締めることを確認します。
          </label>
        )}
        {!canClose && (
          <p className="text-sm text-muted-foreground">
            月締めは翌月から行えます。
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button name="intent" value="save" disabled={pending}>
            メモを保存
          </Button>
          {closed ? (
            <Button
              name="intent"
              value="reopen"
              variant="outline"
              disabled={pending}
            >
              月締めを解除
            </Button>
          ) : (
            <Button
              name="intent"
              value="close"
              variant="outline"
              disabled={pending || !canClose}
            >
              確認して月を締める
            </Button>
          )}
        </div>
      </fieldset>
      {state.message && (
        <p
          role="status"
          className={state.ok ? "text-primary" : "text-destructive"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
