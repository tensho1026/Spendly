/** Server Action と useActionState の間でやり取りする共通の戻り値。 */
export type ActionState = {
  ok: boolean;
  message?: string;
  /** キーはフォームの name 属性と一致させる。 */
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = { ok: false };
