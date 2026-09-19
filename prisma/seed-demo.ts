import { PrismaClient } from "@prisma/client";
import { dateInputToUtc, toDateInputValue } from "../src/lib/format";

const prisma = new PrismaClient();

type SubcategoryProfile = {
  /** 1 か月あたりの想定発生件数の重み */
  weight: number;
  /** 金額の下限・上限（円） */
  min: number;
  max: number;
  /** 100 円単位などの丸め幅 */
  step: number;
  merchants: string[];
  memos: (string | null)[];
};

const PROFILES: Record<string, Record<string, SubcategoryProfile>> = {
  食費: {
    コンビニ: {
      weight: 5,
      min: 280,
      max: 1200,
      step: 10,
      merchants: [
        "セブン-イレブン",
        "ファミリーマート",
        "ローソン",
        "ミニストップ",
      ],
      memos: ["昼食", "朝のコーヒー", "夜食", null, null],
    },
    スーパー: {
      weight: 4,
      min: 1200,
      max: 6800,
      step: 10,
      merchants: ["オーケーストア", "ライフ", "業務スーパー", "まいばすけっと"],
      memos: [
        "一週間分の買い出し",
        "野菜と肉",
        "日持ちする食材をまとめ買い",
        null,
      ],
    },
    外食: {
      weight: 3,
      min: 800,
      max: 5200,
      step: 50,
      merchants: [
        "日高屋",
        "スシロー",
        "サイゼリヤ",
        "つけ麺 和屋",
        "焼肉 山水",
      ],
      memos: ["友人とランチ", "同僚と夕食", "ひとりで軽く", null],
    },
    その他: {
      weight: 1,
      min: 500,
      max: 3000,
      step: 50,
      merchants: ["カルディ", "成城石井", "デパ地下"],
      memos: ["おみやげ用のお菓子", "コーヒー豆", null],
    },
  },
  交通費: {
    電車: {
      weight: 4,
      min: 180,
      max: 1980,
      step: 10,
      merchants: ["JR東日本", "東京メトロ", "東急電鉄", "都営地下鉄"],
      memos: ["ICカードチャージ", "通院のため", "出社", null],
    },
    バス: {
      weight: 2,
      min: 210,
      max: 780,
      step: 10,
      merchants: ["都営バス", "京王バス", "空港リムジンバス"],
      memos: ["雨だったのでバス", null, null],
    },
    タクシー: {
      weight: 1,
      min: 1200,
      max: 5600,
      step: 10,
      merchants: ["GOタクシー", "日本交通", "S.RIDE"],
      memos: ["終電を逃した", "荷物が多かった", null],
    },
    その他: {
      weight: 1,
      min: 300,
      max: 2400,
      step: 50,
      merchants: ["シェアサイクル", "コインパーキング", "高速道路料金"],
      memos: ["駐輪場代", null],
    },
  },
  娯楽: {
    ゲーム: {
      weight: 2,
      min: 980,
      max: 8800,
      step: 10,
      merchants: ["Nintendo eShop", "PlayStation Store", "Steam"],
      memos: ["セールで購入", "課金", null],
    },
    映画: {
      weight: 1,
      min: 1300,
      max: 2400,
      step: 100,
      merchants: ["TOHOシネマズ", "イオンシネマ", "新宿ピカデリー"],
      memos: ["レイトショー", "ポップコーン込み", null],
    },
    音楽: {
      weight: 2,
      min: 980,
      max: 7800,
      step: 10,
      merchants: ["Spotify", "タワーレコード", "ライブハウス 下北沢"],
      memos: ["サブスク月額", "ライブチケット", null],
    },
    その他: {
      weight: 1,
      min: 600,
      max: 4500,
      step: 50,
      merchants: ["ジュンク堂書店", "美術館", "ボードゲームカフェ"],
      memos: ["技術書", "企画展", null],
    },
  },
  生活費: {
    日用品: {
      weight: 3,
      min: 400,
      max: 4800,
      step: 10,
      merchants: ["マツモトキヨシ", "ダイソー", "ニトリ", "Amazon"],
      memos: ["洗剤とティッシュ", "キッチン用品", "詰め替え", null],
    },
    衣服: {
      weight: 1,
      min: 1900,
      max: 14800,
      step: 100,
      merchants: ["ユニクロ", "GU", "無印良品", "ZOZOTOWN"],
      memos: ["季節の入れ替え", "仕事用のシャツ", null],
    },
    その他: {
      weight: 2,
      min: 2500,
      max: 12000,
      step: 100,
      merchants: ["東京電力", "東京ガス", "docomo", "クリーニング店"],
      memos: ["光熱費", "通信費", "月末の支払い", null],
    },
  },
};

/** 実行ごとに結果がぶれないよう、決定的な擬似乱数を使う */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

async function main() {
  const random = createRandom(20260917);
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

  const categories = await prisma.category.findMany({
    include: { subcategories: true },
    orderBy: { sortOrder: "asc" },
  });

  if (categories.length === 0) {
    throw new Error(
      "カテゴリが存在しません。先に `npm run db:seed` を実行してください。",
    );
  }

  const deleted = await prisma.expense.deleteMany();
  console.log(`既存の支出 ${deleted.count} 件を削除しました`);

  // 抽選用のプール（カテゴリ・小カテゴリの組を重みぶんだけ並べる）
  const pool: {
    categoryId: string;
    subcategoryId: string;
    profile: SubcategoryProfile;
  }[] = [];

  for (const category of categories) {
    const categoryProfiles = PROFILES[category.name];
    if (!categoryProfiles) continue;

    for (const subcategory of category.subcategories) {
      const profile = categoryProfiles[subcategory.name];
      if (!profile) continue;

      for (let i = 0; i < profile.weight; i += 1) {
        pool.push({
          categoryId: category.id,
          subcategoryId: subcategory.id,
          profile,
        });
      }
    }
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 今月・先月・先々月の 3 か月ぶんを生成する
  const months = [2, 1, 0].map((offset) => {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const lastDayOfMonth = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
    ).getDate();
    // 今月は今日までしか支出が存在しないようにする
    const maxDay = offset === 0 ? Math.max(today.getDate(), 1) : lastDayOfMonth;
    return { start, maxDay, isCurrentMonth: offset === 0 };
  });

  const data: {
    amount: number;
    date: Date;
    categoryId: string;
    subcategoryId: string;
    merchant: string;
    memo: string | null;
  }[] = [];

  for (const month of months) {
    // 月ごとに 16〜18 件（今月のみ日数に応じて控えめに）
    const base = 16 + Math.floor(random() * 3);
    const count = month.isCurrentMonth
      ? Math.max(8, Math.round((base * month.maxDay) / 28))
      : base;

    for (let i = 0; i < count; i += 1) {
      const entry = pick(pool);
      const { profile } = entry;

      const steps = Math.floor((profile.max - profile.min) / profile.step) + 1;
      const amount = profile.min + Math.floor(random() * steps) * profile.step;

      const day = 1 + Math.floor(random() * month.maxDay);
      const hour = 8 + Math.floor(random() * 13);
      const minute = Math.floor(random() * 60);
      const date = new Date(
        month.start.getFullYear(),
        month.start.getMonth(),
        day,
        hour,
        minute,
      );

      data.push({
        amount,
        date,
        categoryId: entry.categoryId,
        subcategoryId: entry.subcategoryId,
        merchant: pick(profile.merchants),
        memo: pick(profile.memos),
      });
    }
  }

  data.sort((a, b) => a.date.getTime() - b.date.getTime());

  const byDay = new Map<string, typeof data>();
  for (const item of data) {
    const key = toDateInputValue(item.date);
    byDay.set(key, [...(byDay.get(key) ?? []), item]);
  }
  await prisma.$transaction(
    async (tx) => {
      for (const [key, items] of byDay) {
        const date = dateInputToUtc(key)!;
        // Demo data never replaces a day the user has already entered.
        if (await tx.dailyExpense.findUnique({ where: { date } })) continue;
        await tx.dailyExpense.create({
          data: {
            date,
            total: items.reduce((sum, item) => sum + item.amount, 0),
            items: {
              create: items.map((item, sortOrder) => ({
                ...item,
                date,
                sortOrder,
              })),
            },
          },
        });
      }
    },
    { timeout: 30000 },
  );

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  console.log(
    `デモ用の支出 ${data.length} 件（合計 ${total.toLocaleString("ja-JP")} 円）を投入しました`,
  );

  for (const month of months) {
    const label = `${month.start.getFullYear()}年${month.start.getMonth() + 1}月`;
    const monthly = data.filter(
      (item) =>
        item.date.getFullYear() === month.start.getFullYear() &&
        item.date.getMonth() === month.start.getMonth(),
    );
    const monthlyTotal = monthly.reduce((sum, item) => sum + item.amount, 0);
    console.log(
      `  ${label}: ${monthly.length} 件 / ${monthlyTotal.toLocaleString("ja-JP")} 円`,
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("デモデータの投入に失敗しました:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
