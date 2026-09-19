"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="rounded-xl border bg-card p-8 text-center">
      <h1 className="text-xl font-bold">読み込みに失敗しました</h1>
      <p className="my-4 text-sm text-muted-foreground">
        接続を確認し、もう一度お試しください。
      </p>
      <Button onClick={reset}>もう一度読み込む</Button>
    </div>
  );
}
