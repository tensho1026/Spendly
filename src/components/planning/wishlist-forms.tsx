"use client";

import { useActionState, useState } from "react";
import {
  saveWishAction,
  changeWishAction,
  purchaseWishAction,
} from "@/app/actions/wishlist";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";

type Wish = {
  id: string;
  name: string;
  amount: number;
  url: string;
  memo: string;
};
export function WishForm({ item }: { item?: Wish }) {
  const [state, action, pending] = useActionState(
    saveWishAction,
    initialActionState,
  );
  const [values, setValues] = useState({
    name: item?.name ?? "",
    amount: item ? String(item.amount) : "",
    url: item?.url ?? "",
    memo: item?.memo ?? "",
  });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="wish-name">名前</Label>
          <Input
            id="wish-name"
            name="name"
            required
            maxLength={100}
            value={values.name}
            onChange={(event) =>
              setValues((old) => ({ ...old, name: event.target.value }))
            }
            placeholder="例: ワイヤレスイヤホン"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wish-amount">予定金額（円）</Label>
          <Input
            id="wish-amount"
            name="amount"
            type="number"
            min={1}
            max={2147483647}
            step={1}
            required
            value={values.amount}
            onChange={(event) =>
              setValues((old) => ({ ...old, amount: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="wish-url">商品URL（任意）</Label>
          <Input
            id="wish-url"
            name="url"
            type="url"
            maxLength={2000}
            value={values.url}
            onChange={(event) =>
              setValues((old) => ({ ...old, url: event.target.value }))
            }
            placeholder="https://"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="wish-memo">メモ（任意）</Label>
          <Textarea
            id="wish-memo"
            name="memo"
            maxLength={500}
            value={values.memo}
            onChange={(event) =>
              setValues((old) => ({ ...old, memo: event.target.value }))
            }
            placeholder="欲しい理由、購入時期など"
          />
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
      <Button disabled={pending}>
        {pending ? "保存中…" : item ? "変更を保存" : "ほしいものを追加"}
      </Button>
    </form>
  );
}

export function WishControls({
  id,
  purchased,
  recorded,
}: {
  id: string;
  purchased: boolean;
  recorded: boolean;
}) {
  const [state, action, pending] = useActionState(
    changeWishAction,
    initialActionState,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        {!purchased && (
          <Button
            name="intent"
            value="purchased"
            variant="outline"
            size="sm"
            disabled={pending}
          >
            購入済みにする（支出追加なし）
          </Button>
        )}
        {purchased && !recorded && (
          <Button
            name="intent"
            value="restore"
            variant="outline"
            size="sm"
            disabled={pending}
          >
            ほしいものに戻す
          </Button>
        )}
        {!confirmDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
          >
            削除
          </Button>
        ) : (
          <>
            <span className="self-center text-sm">
              リストから削除しますか？支出記録は残ります。
            </span>
            <Button
              name="intent"
              value="delete"
              variant="destructive"
              size="sm"
              disabled={pending}
            >
              削除する
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              キャンセル
            </Button>
          </>
        )}
      </div>
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

export function PurchaseForm({
  item,
  categories,
  today,
}: {
  item: Wish;
  categories: { id: string; name: string }[];
  today: string;
}) {
  const [state, action, pending] = useActionState(
    purchaseWishAction,
    initialActionState,
  );
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState(String(item.amount));
  const [categoryId, setCategoryId] = useState("");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={item.id} />
      <p className="rounded-lg bg-secondary p-3 text-sm">
        購入日の支出合計と内訳に、この金額を追加します。すでに家計簿に入力した買い物は、リストの「購入済みにする（支出追加なし）」を使ってください。
      </p>
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="purchase-date">購入日</Label>
          <Input
            id="purchase-date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase-amount">実際の購入金額（円）</Label>
          <Input
            id="purchase-amount"
            name="amount"
            type="number"
            min={1}
            max={2147483647}
            step={1}
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase-category">カテゴリ</Label>
          <NativeSelect
            id="purchase-category"
            name="categoryId"
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="" disabled>
              選択してください
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </fieldset>
      {categories.length === 0 && (
        <p className="text-sm text-destructive">
          設定からカテゴリを追加してください。
        </p>
      )}
      {state.message && (
        <p role="status" className="text-destructive">
          {state.message}
        </p>
      )}
      <Button disabled={pending || categories.length === 0}>
        {pending ? "登録中…" : "支出を追加して購入済みにする"}
      </Button>
    </form>
  );
}
