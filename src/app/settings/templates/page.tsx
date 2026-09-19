import Link from "next/link";
import { TemplateManager } from "@/components/settings/template-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTemplates } from "@/lib/ledger";
import { getCategoriesWithSub } from "@/lib/queries";
export const dynamic = "force-dynamic";
export default async function TemplatesPage() {
  const [categories, templates] = await Promise.all([getCategoriesWithSub(), getTemplates()]);
  return <div className="space-y-6"><Link href="/settings" className="text-sm text-muted-foreground">← 設定</Link><div><h1 className="text-2xl font-bold">よく使う内訳</h1><p className="mt-2 text-sm text-muted-foreground">カテゴリ・金額・メモを登録し、1日の入力画面からすぐ追加できます。</p></div><Card><CardHeader><CardTitle>内訳テンプレート</CardTitle><CardDescription>追加後も入力画面で金額やメモを自由に調整できます。</CardDescription></CardHeader><CardContent><TemplateManager categories={categories} templates={templates} /></CardContent></Card></div>;
}
