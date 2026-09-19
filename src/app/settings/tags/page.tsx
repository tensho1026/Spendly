import Link from "next/link";
import { TagManager } from "@/components/settings/tag-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTags } from "@/lib/ledger";
export const dynamic = "force-dynamic";
export default async function TagsPage(){const tags=await getTags();return <div className="space-y-6"><Link href="/settings" className="text-sm text-muted-foreground">← 設定</Link><div><h1 className="text-2xl font-bold">タグ管理</h1><p className="mt-2 text-sm text-muted-foreground">旅行・仕事・家族など、目的に合うタグを自由に作成できます。</p></div><Card><CardHeader><CardTitle>タグ</CardTitle><CardDescription>支出入力では内訳ごとに複数のタグを付けられます。</CardDescription></CardHeader><CardContent><TagManager tags={tags}/></CardContent></Card></div>}
