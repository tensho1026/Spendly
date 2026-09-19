"use client";

import { useState } from "react";
import { Pencil, Plus, Tags } from "lucide-react";
import {
  deleteCategoryAction,
  deleteSubcategoryAction,
  renameCategoryAction,
  renameSubcategoryAction,
} from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryWithSub } from "@/lib/queries";
import {
  CreateCategoryForm,
  CreateSubcategoryForm,
  InlineRenameForm,
} from "./category-forms";
import { DeleteDialog } from "./delete-dialog";

function CategoryItem({ category }: { category: CategoryWithSub }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  return (
    <Card>
      <CardHeader>
        {editing === category.id ? (
          <InlineRenameForm
            action={renameCategoryAction}
            id={category.id}
            currentName={category.name}
            inputId={`rename-${category.id}`}
            label="大カテゴリ名"
            onClose={() => setEditing(null)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Tags className="size-5 text-primary" />
            <CardTitle className="min-w-0 flex-1 break-words text-base">
              {category.name}
            </CardTitle>
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
              title="大カテゴリを削除"
              itemName={category.name}
              note="この中の詳細カテゴリも削除されます。"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y">
          {category.subcategories.map((sub) => (
            <li key={sub.id} className="py-2">
              {editing === sub.id ? (
                <InlineRenameForm
                  action={renameSubcategoryAction}
                  id={sub.id}
                  currentName={sub.name}
                  inputId={`rename-${sub.id}`}
                  label="詳細カテゴリ名"
                  onClose={() => setEditing(null)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 break-words text-sm">
                    {sub.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${sub.name}の名前を変更`}
                    onClick={() => setEditing(sub.id)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <DeleteDialog
                    action={deleteSubcategoryAction}
                    id={sub.id}
                    triggerLabel={`${sub.name}を削除`}
                    title="詳細カテゴリを削除"
                    itemName={sub.name}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
        {category.subcategories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            詳細カテゴリはまだありません。
          </p>
        )}
        {adding ? (
          <CreateSubcategoryForm
            categoryId={category.id}
            categoryName={category.name}
            onClose={() => setAdding(false)}
          />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            詳細カテゴリを追加
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryManager({
  categories,
}: {
  categories: CategoryWithSub[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">大カテゴリを追加</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCategoryForm />
        </CardContent>
      </Card>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        {categories.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </div>
      {categories.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          上のフォームから最初のカテゴリを作成しましょう。
        </p>
      )}
    </div>
  );
}
