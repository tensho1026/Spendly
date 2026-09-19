"use client";

import { useActionState, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, Plus, X } from "lucide-react";

import {
  createCategoryAction,
  createSubcategoryAction,
} from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";
import { useActionToast, type CategoryFormAction } from "./use-action-toast";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  icon?: ReactNode;
  size?: "sm" | "default";
};

export function SubmitButton({
  label,
  pendingLabel,
  icon,
  size = "sm",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size={size} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
  );
}

function CancelButton({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={onCancel}
    >
      キャンセル
    </Button>
  );
}

function FieldErrors({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {messages.join(" / ")}
    </p>
  );
}

type InlineRenameFormProps = {
  /** renameCategoryAction もしくは renameSubcategoryAction。 */
  action: CategoryFormAction;
  id: string;
  currentName: string;
  inputId: string;
  label: string;
  onClose: () => void;
  className?: string;
};

/** 名前をその場で編集するフォーム。成功したら呼び出し元に閉じてもらう。 */
export function InlineRenameForm({
  action,
  id,
  currentName,
  inputId,
  label,
  onClose,
  className,
}: InlineRenameFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);
  useActionToast(state, onClose);

  return (
    <form action={formAction} className={cn("space-y-1.5", className)}>
      <input type="hidden" name="id" value={id} />
      <Label htmlFor={inputId} className="sr-only">
        {label}
      </Label>

      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          name="name"
          defaultValue={currentName}
          required
          autoFocus
          autoComplete="off"
          maxLength={30}
          className="h-9 flex-1"
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={
            state.fieldErrors?.name ? `${inputId}-error` : undefined
          }
        />
        <SubmitButton
          label="保存"
          pendingLabel="保存中..."
          icon={<Check className="size-4" aria-hidden="true" />}
        />
        <CancelButton onCancel={onClose} />
      </div>

      <FieldErrors id={`${inputId}-error`} messages={state.fieldErrors?.name} />
    </form>
  );
}

type CreateCategoryFormProps = {
  onClose?: () => void;
};

/** 大カテゴリの追加フォーム。 */
export function CreateCategoryForm({ onClose }: CreateCategoryFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createCategoryAction,
    initialActionState,
  );
  useActionToast(state, () => {
    formRef.current?.reset();
    onClose?.();
  });

  return (
    <form ref={formRef} action={formAction} className="space-y-1.5">
      <Label htmlFor="new-category-name" className="sr-only">
        大カテゴリ名
      </Label>

      <div className="flex items-center gap-2">
        <Input
          id="new-category-name"
          name="name"
          placeholder="例: 食費"
          required
          autoComplete="off"
          maxLength={30}
          className="h-9 flex-1"
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={
            state.fieldErrors?.name ? "new-category-name-error" : undefined
          }
        />
        <SubmitButton
          label="追加"
          pendingLabel="追加中..."
          icon={<Plus className="size-4" aria-hidden="true" />}
        />
        {onClose ? <CancelButton onCancel={onClose} /> : null}
      </div>

      <FieldErrors
        id="new-category-name-error"
        messages={state.fieldErrors?.name}
      />
    </form>
  );
}

type CreateSubcategoryFormProps = {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
};

/** 詳細カテゴリの追加フォーム。 */
export function CreateSubcategoryForm({
  categoryId,
  categoryName,
  onClose,
}: CreateSubcategoryFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createSubcategoryAction,
    initialActionState,
  );
  useActionToast(state, () => {
    formRef.current?.reset();
    onClose();
  });

  const inputId = `new-subcategory-${categoryId}`;

  return (
    <form ref={formRef} action={formAction} className="space-y-1.5">
      <input type="hidden" name="categoryId" value={categoryId} />
      <Label htmlFor={inputId} className="sr-only">
        {categoryName}の詳細カテゴリ名
      </Label>

      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          name="name"
          placeholder="例: コンビニ"
          required
          autoFocus
          autoComplete="off"
          maxLength={30}
          className="h-9 flex-1"
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={
            state.fieldErrors?.name ? `${inputId}-error` : undefined
          }
        />
        <SubmitButton
          label="追加"
          pendingLabel="追加中..."
          icon={<Plus className="size-4" aria-hidden="true" />}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="追加をやめる"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <FieldErrors id={`${inputId}-error`} messages={state.fieldErrors?.name} />
    </form>
  );
}
