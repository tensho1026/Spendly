"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";

/** Server Action のシグネチャ（useActionState 用）。 */
export type CategoryFormAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/**
 * Server Action の結果をトーストで通知する。
 * 直前に処理した state を ref に保持し、再レンダリングだけで二重に発火しないようにする。
 * 初期 state（マウント時の値）は通知対象にしない。
 */
export function useActionToast(
  state: ActionState,
  onSuccess?: () => void,
): void {
  const handledStateRef = useRef<ActionState>(state);

  useEffect(() => {
    if (handledStateRef.current === state) {
      return;
    }
    handledStateRef.current = state;

    if (state.ok) {
      if (state.message) {
        toast.success(state.message);
      }
      onSuccess?.();
      return;
    }

    if (state.message) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);
}
