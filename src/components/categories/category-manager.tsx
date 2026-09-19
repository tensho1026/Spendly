"use client";
import { useState } from "react";
import { Pencil, Tags } from "lucide-react";
import {
  deleteCategoryAction,
  renameCategoryAction,
} from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCategoryForm, InlineRenameForm } from "./category-forms";
import { DeleteDialog } from "./delete-dialog";
export function CategoryManager({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">カテゴリを追加</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCategoryForm />
        </CardContent>
      </Card>
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="rounded-xl border bg-card p-4">
            {editing === category.id ? (
              <InlineRenameForm
                action={renameCategoryAction}
                id={category.id}
                currentName={category.name}
                inputId={`rename-${category.id}`}
                label="カテゴリ名"
                onClose={() => setEditing(null)}
              />
            ) : (
              <div className="flex items-center gap-3">
                <Tags className="size-4 text-primary" />
                <span className="min-w-0 flex-1 break-words font-medium">
                  {category.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${category.name}の名前を変更`}
                  onClick={() => setEditing(category.id)}
                >
                  <Pencil className="size-4" />
                </Button>
                <DeleteDialog
                  action={deleteCategoryAction}
                  id={category.id}
                  triggerLabel={`${category.name}を削除`}
                  title="カテゴリを削除"
                  itemName={category.name}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
