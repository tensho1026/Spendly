import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export type ExpenseFormRow = {
  key: number;
  categoryId: string;
  amount: string;
  memo: string;
  dueDay: string;
  tagIds: string[];
};

export type ExpenseRowField = "categoryId" | "amount" | "memo";

export function ExpenseItemRow({
  row,
  index,
  mode,
  categories,
  tags,
  normalizeAmount,
  onChange,
  onDueDayChange,
  onTagsChange,
  onRemove,
}: {
  row: ExpenseFormRow;
  index: number;
  mode: "daily" | "fixed";
  categories: { id: string; name: string }[];
  tags: { id: string; name: string; color: string }[];
  normalizeAmount: (value: string) => string;
  onChange: (field: ExpenseRowField, value: string) => void;
  onDueDayChange: (value: string) => void;
  onTagsChange: (tagIds: string[]) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-background/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {index + 1}件目
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${index + 1}行目を削除`}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
          削除
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`category-${row.key}`}>カテゴリ</Label>
          <NativeSelect
            id={`category-${row.key}`}
            aria-label={`${index + 1}行目のカテゴリ`}
            required
            value={row.categoryId}
            onChange={(event) => onChange("categoryId", event.target.value)}
          >
            <option value="">カテゴリを選択</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`amount-${row.key}`}>金額（円）</Label>
          <Input
            id={`amount-${row.key}`}
            aria-label={`${index + 1}行目の金額`}
            inputMode="numeric"
            required
            placeholder="0"
            value={row.amount}
            onChange={(event) =>
              onChange("amount", normalizeAmount(event.target.value))
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`memo-${row.key}`}>
          メモ <span className="text-xs text-muted-foreground">任意</span>
        </Label>
        <Textarea
          id={`memo-${row.key}`}
          aria-label={`${index + 1}行目のメモ`}
          rows={2}
          maxLength={500}
          placeholder={
            mode === "daily"
              ? "例: 昼ごはん、週末の買い出し"
              : "例: 家賃、音楽サブスク"
          }
          value={row.memo}
          onChange={(event) => onChange("memo", event.target.value)}
        />
      </div>
      {mode === "fixed" && (
        <div className="space-y-2">
          <Label htmlFor={`due-day-${row.key}`}>
            支払日 <span className="text-xs text-muted-foreground">任意</span>
          </Label>
          <Input
            id={`due-day-${row.key}`}
            aria-label={`${index + 1}行目の支払日`}
            inputMode="numeric"
            placeholder="例: 25"
            value={row.dueDay}
            onChange={(event) =>
              onDueDayChange(normalizeAmount(event.target.value).slice(0, 2))
            }
          />
        </div>
      )}
      {mode === "daily" && tags.length > 0 && (
        <details className="rounded-lg border border-dashed p-3">
          <summary className="cursor-pointer text-sm font-medium">
            タグを追加{row.tagIds.length ? `（${row.tagIds.length}個）` : ""}
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = row.tagIds.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${selected ? "border-primary bg-secondary text-primary" : "bg-background text-muted-foreground"}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected}
                    onChange={(event) =>
                      onTagsChange(
                        event.target.checked
                          ? [...row.tagIds, tag.id]
                          : row.tagIds.filter((id) => id !== tag.id),
                      )
                    }
                  />
                  #{tag.name}
                </label>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
