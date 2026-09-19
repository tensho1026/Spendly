import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ExpenseNotFound() {
  return (
    <div className="py-10">
      <EmptyState
        title="支出が見つかりません"
        description="すでに削除されたか、URL が正しくない可能性があります。"
        action={
          <Button asChild>
            <Link href="/expenses">日々の支出に戻る</Link>
          </Button>
        }
      />
    </div>
  );
}
