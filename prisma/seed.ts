import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CategorySeed = {
  name: string;
  subcategories: string[];
};

const CATEGORY_SEED: CategorySeed[] = [
  { name: "食費", subcategories: ["コンビニ", "スーパー", "外食", "その他"] },
  { name: "交通費", subcategories: ["電車", "バス", "タクシー", "その他"] },
  { name: "娯楽", subcategories: ["ゲーム", "映画", "音楽", "その他"] },
  { name: "生活費", subcategories: ["日用品", "衣服", "その他"] },
];

async function main() {
  for (const [categoryIndex, seed] of CATEGORY_SEED.entries()) {
    const category = await prisma.category.upsert({
      where: { name: seed.name },
      update: { sortOrder: categoryIndex },
      create: { name: seed.name, sortOrder: categoryIndex },
    });

    for (const [subIndex, name] of seed.subcategories.entries()) {
      await prisma.subcategory.upsert({
        where: {
          categoryId_name: { categoryId: category.id, name },
        },
        update: { sortOrder: subIndex },
        create: { categoryId: category.id, name, sortOrder: subIndex },
      });
    }

    console.log(
      `カテゴリ「${seed.name}」と小カテゴリ ${seed.subcategories.length} 件を投入しました`,
    );
  }

  console.log("初期カテゴリの投入が完了しました");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("シードの実行に失敗しました:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
