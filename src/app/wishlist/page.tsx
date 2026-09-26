import Link from "next/link";
import { notFound } from "next/navigation";
import {
  WishForm,
  WishControls,
  PurchaseForm,
} from "@/components/planning/wishlist-forms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatDateJP, formatYen, toDateInputValue } from "@/lib/format";
import { getCategoriesWithSub } from "@/lib/queries";

export const dynamic = "force-dynamic";
export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    purchase?: string;
    view?: string;
    saved?: string;
  }>;
}) {
  const params = await searchParams;
  const target = params.edit || params.purchase;
  if (target) {
    const item = await prisma.wishItem.findUnique({ where: { id: target } });
    if (!item) notFound();
    const purchase = !!params.purchase;
    return (
      <div className="space-y-6">
        <Link href="/wishlist" className="text-sm text-primary">
          ← ほしいものリスト
        </Link>
        <h1 className="text-2xl font-bold">
          {purchase ? "購入を記録" : "ほしいものを編集"}
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {purchase ? (
              item.purchasedAt ? (
                <p>
                  購入済みです。
                  {item.dailyId && (
                    <Link
                      className="text-primary"
                      href={`/expenses/${item.dailyId}`}
                    >
                      支出を確認 →
                    </Link>
                  )}
                </p>
              ) : (
                <PurchaseForm
                  item={item}
                  categories={await getCategoriesWithSub()}
                  today={toDateInputValue(new Date())}
                />
              )
            ) : (
              <WishForm key={item.id} item={item} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  const purchased = params.view === "purchased";
  const [items, waiting] = await Promise.all([
    prisma.wishItem.findMany({
      where: { purchasedAt: purchased ? { not: null } : null },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    prisma.wishItem.aggregate({
      where: { purchasedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ほしいものリスト</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          欲しい理由や金額を残して、買うタイミングを考えましょう。予定金額は支出や残り予算には含めません。
        </p>
      </div>
      {params.saved === "1" && (
        <p role="status" className="rounded-lg bg-secondary p-3 text-primary">
          ほしいものを保存しました。
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">検討中の合計</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {formatYen(waiting._sum.amount ?? 0)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {waiting._count}件のほしいもの
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ほしいものを追加</CardTitle>
        </CardHeader>
        <CardContent>
          <WishForm />
        </CardContent>
      </Card>
      <nav aria-label="ほしいものの表示" className="flex gap-2">
        <Button asChild variant={!purchased ? "secondary" : "outline"}>
          <Link aria-current={!purchased ? "page" : undefined} href="/wishlist">
            検討中
          </Link>
        </Button>
        <Button asChild variant={purchased ? "secondary" : "outline"}>
          <Link
            aria-current={purchased ? "page" : undefined}
            href="/wishlist?view=purchased"
          >
            購入済み
          </Link>
        </Button>
      </nav>
      {!items.length && (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {purchased
            ? "購入済みの品はまだありません。"
            : "ほしいものを追加してみましょう。"}
        </p>
      )}
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle className="break-words text-base">
                  {item.name}
                </CardTitle>
                <p className="font-bold">予定 {formatYen(item.amount)}</p>
              </div>
              {item.purchasedAt && (
                <CardDescription>
                  {formatDateJP(item.purchasedAt)}・購入済み
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {item.memo && (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {item.memo}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-primary">
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    商品ページ ↗
                  </a>
                )}
                <Link href={`/wishlist?edit=${item.id}`}>編集</Link>
                {!item.purchasedAt && (
                  <Link href={`/wishlist?purchase=${item.id}`}>
                    購入して支出に記録 →
                  </Link>
                )}
                {item.dailyId && (
                  <Link href={`/expenses/${item.dailyId}`}>
                    登録した日の支出 →
                  </Link>
                )}
              </div>
              <WishControls
                id={item.id}
                purchased={!!item.purchasedAt}
                recorded={!!item.dailyId}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
