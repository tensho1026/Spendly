"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";

import { deleteExpenseAction } from "@/app/actions/expenses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { initialActionState } from "@/lib/action-state";
import { formatDateJP, formatYen } from "@/lib/format";
import type { DailyRecord } from "@/lib/ledger";

export type DeleteExpenseDialogProps = {
  expense: DailyRecord;
};

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          削除中...
        </>
      ) : (
        "削除"
      )}
    </Button>
  );
}

export function DeleteExpenseDialog({ expense }: DeleteExpenseDialogProps) {
  const [state, formAction] = useActionState(
    deleteExpenseAction,
    initialActionState,
  );

  const heading = formatDateJP(expense.date);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="size-4" />
          削除
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>この日の記録を削除しますか？</DialogTitle>
          <DialogDescription>
            この日の合計とすべての内訳を削除します。元には戻せません。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 rounded-lg border bg-muted/40 p-4">
          <p className="font-medium break-words">{heading}</p>
          <p className="text-sm text-muted-foreground break-words">
            {expense.items.length}件の内訳
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {formatYen(expense.total)}
          </p>
        </div>

        {state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <form action={formAction}>
          <input type="hidden" name="id" value={expense.id} />
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </DialogClose>
            <DeleteButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
