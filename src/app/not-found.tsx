import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="space-y-4 py-20 text-center">
      <p className="text-sm font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="text-sm text-muted-foreground">
        ページが移動したか、削除された可能性があります。
      </p>
      <Button asChild>
        <Link href="/dashboard">ダッシュボードへ戻る</Link>
      </Button>
    </div>
  );
}
