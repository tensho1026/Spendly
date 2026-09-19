import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { CategoryManager } from "@/components/categories/category-manager";
import { Button } from "@/components/ui/button";
import { getCategoriesWithSub } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CategoriesSettingsPage() {
  const categories = await getCategoriesWithSub();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/settings">
            <ChevronLeft className="size-4" aria-hidden="true" />
            設定
          </Link>
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">カテゴリ</h1>
          <p className="text-sm text-muted-foreground">
            支出を分類するための大カテゴリと、その中の詳細カテゴリを管理します。支出が紐づいているカテゴリは削除できません。
          </p>
        </div>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}
