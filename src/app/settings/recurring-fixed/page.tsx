import Link from "next/link";
import { RecurringFixedManager } from "@/components/settings/recurring-fixed-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecurringFixed } from "@/lib/ledger";
import { getCategoriesWithSub } from "@/lib/queries";
import { currentMonth, formatMonthParam } from "@/lib/month";
export const dynamic = "force-dynamic";
export default async function RecurringFixedPage() { const [rules,categories] = await Promise.all([getRecurringFixed(), getCategoriesWithSub()]); return <div className="space-y-6"><Link href="/settings" className="text-sm text-muted-foreground">← 設定</Link><div><h1 className="text-2xl font-bold">固定費の自動作成</h1><p className="mt-2 text-sm text-muted-foreground">月の固定費を開いたとき、開始月以降へ一度だけ自動で追加します。</p></div><Card><CardHeader><CardTitle>毎月のルール</CardTitle><CardDescription>生成後の固定費は、その月だけ金額やメモを変更できます。</CardDescription></CardHeader><CardContent><RecurringFixedManager rules={rules} categories={categories} currentMonth={formatMonthParam(currentMonth())} /></CardContent></Card></div>; }
