import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

async function main() {
  if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to a disposable test database.");
  const prisma = new PrismaClient({datasourceUrl:process.env.TEST_DATABASE_URL});
  const rollback = new Error("ROLLBACK_TEST_SCHEMA");
  try {
    await prisma.$transaction(async tx => {
      const schema = `migration_test_${Date.now()}`;
      await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
      async function apply(path:string) {
        const sql = await readFile(path,"utf8");
        for (const statement of sql.split(";").map(part=>part.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
      }
      await apply("prisma/migrations/20260917131904_init/migration.sql");
      await tx.$executeRawUnsafe(`INSERT INTO "Category" ("id","name","updatedAt") VALUES ('test-category','test',NOW())`);
      await tx.$executeRawUnsafe(`INSERT INTO "Expense" ("id","amount","date","categoryId","memo","updatedAt") VALUES ('first',1000,'2026-08-31 15:00:00','test-category','preserved memo',NOW()),('second',2000,'2026-09-01 14:59:59','test-category',NULL,NOW()),('third',500,'2026-09-01 15:00:00','test-category',NULL,NOW())`);
      await apply("prisma/migrations/20260919080000_daily_and_fixed/migration.sql");
      const days = await tx.$queryRawUnsafe<{id:string;total:number}[]>(`SELECT "id","total" FROM "DailyExpense" ORDER BY "date"`);
      assert.deepEqual(days,[{id:"day_2026-09-01",total:3000},{id:"day_2026-09-02",total:500}]);
      const rows = await tx.$queryRawUnsafe<{id:string;dailyId:string;memo:string}[]>(`SELECT "id","dailyId","memo" FROM "Expense" ORDER BY "id"`);
      assert.equal(rows.length,3);
      assert.equal(rows[0].memo,"preserved memo");
      assert.equal(rows[0].dailyId,"day_2026-09-01");
      await tx.$executeRawUnsafe(`DELETE FROM "DailyExpense" WHERE "id"='day_2026-09-01'`);
      const remaining = await tx.$queryRawUnsafe<{count:number}[]>(`SELECT COUNT(*)::integer AS count FROM "Expense"`);
      assert.equal(remaining[0].count,1);
      throw rollback;
    },{timeout:30000});
  } catch (error) {
    if (error !== rollback) throw error;
    console.log("PASS: migration preserves rows, memos, JST day boundaries and cascade deletion (rolled back)");
  } finally { await prisma.$disconnect(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
