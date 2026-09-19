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
import { formatYen } from "@/lib/format";
import type { ExpenseWithRelations } from "@/lib/queries";

export type DeleteExpenseDialogProps = {
  expense: ExpenseWithRelations;
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

  const heading =
    expense.merchant?.trim() || expense.memo?.trim() || expense.category.name;
  const categoryPath = expense.subcategory
    ? `${expense.category.name} > ${expense.subcategory.name}`
    : expense.category.name;

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
          <DialogTitle>この支出を削除しますか？</DialogTitle>
          <DialogDescription>削除すると元に戻せません。</DialogDescription>
        </DialogHeader>

        <div className="space-y-1 rounded-lg border bg-muted/40 p-4">
          <p className="font-medium break-words">{heading}</p>
          <p className="text-sm text-muted-foreground break-words">
            {categoryPath}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {formatYen(expense.amount)}
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
