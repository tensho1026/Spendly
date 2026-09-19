"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";

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
import { useActionToast, type CategoryFormAction } from "./use-action-toast";

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          削除中...
        </>
      ) : (
        "削除"
      )}
    </Button>
  );
}

type DeleteDialogProps = {
  /** deleteCategoryAction もしくは deleteSubcategoryAction。 */
  action: CategoryFormAction;
  id: string;
  triggerLabel: string;
  title: string;
  itemName: string;
  note?: string;
};

/** 確認ダイアログ付きの削除フォーム。削除できない場合はダイアログを開いたままメッセージを表示する。 */
export function DeleteDialog({
  action,
  id,
  triggerLabel,
  title,
  itemName,
  note,
}: DeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialActionState);

  const handleSuccess = useCallback(() => {
    setOpen(false);
  }, []);
  useActionToast(state, handleSuccess);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={triggerLabel}>
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>削除すると元に戻せません。</DialogDescription>
        </DialogHeader>

        <div className="space-y-1 rounded-lg border bg-muted/40 p-4">
          <p className="font-medium break-words">{itemName}</p>
          {note ? (
            <p className="text-sm text-muted-foreground">{note}</p>
          ) : null}
        </div>

        {!state.ok && state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </DialogClose>
            <DeleteSubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
