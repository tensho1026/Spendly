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
      await apply("prisma/migrations/20260919113000_budgets_and_templates/migration.sql");
      await apply("prisma/migrations/20260919122000_income_and_recurring_fixed/migration.sql");
      const days = await tx.$queryRawUnsafe<{id:string;total:number}[]>(`SELECT "id","total" FROM "DailyExpense" ORDER BY "date"`);
      assert.deepEqual(days,[{id:"day_2026-09-01",total:3000},{id:"day_2026-09-02",total:500}]);
      const rows = await tx.$queryRawUnsafe<{id:string;dailyId:string;memo:string}[]>(`SELECT "id","dailyId","memo" FROM "Expense" ORDER BY "id"`);
      assert.equal(rows.length,3);
      assert.equal(rows[0].memo,"preserved memo");
      assert.equal(rows[0].dailyId,"day_2026-09-01");
      await tx.$executeRawUnsafe(`INSERT INTO "CategoryBudget" ("id","month","categoryId","amount","updatedAt") VALUES ('budget','2026-09','test-category',30000,NOW())`);
      await tx.$executeRawUnsafe(`INSERT INTO "ExpenseTemplate" ("id","categoryId","amount","memo","updatedAt") VALUES ('template','test-category',1000,'lunch',NOW())`);
      const planning = await tx.$queryRawUnsafe<{budgets:number;templates:number}[]>(`SELECT (SELECT COUNT(*)::integer FROM "CategoryBudget") AS budgets, (SELECT COUNT(*)::integer FROM "ExpenseTemplate") AS templates`);
      assert.deepEqual(planning[0], { budgets: 1, templates: 1 });
      await tx.$executeRawUnsafe(`INSERT INTO "Income" ("id","date","type","amount","memo","updatedAt") VALUES ('income','2026-09-18 15:00:00','salary',250000,'salary',NOW())`);
      await tx.$executeRawUnsafe(`INSERT INTO "RecurringFixedExpense" ("id","categoryId","amount","memo","dueDay","startMonth","updatedAt") VALUES ('rule','test-category',80000,'rent',25,'2026-09',NOW())`);
      await tx.$executeRawUnsafe(`INSERT INTO "FixedMonth" ("month","updatedAt") VALUES ('2026-09',NOW())`);
      await tx.$executeRawUnsafe(`INSERT INTO "FixedExpense" ("id","month","categoryId","amount","dueDay","recurringId") VALUES ('generated','2026-09','test-category',80000,25,'rule')`);
      const cashflow = await tx.$queryRawUnsafe<{income:number;rules:number;generated:number}[]>(`SELECT (SELECT COUNT(*)::integer FROM "Income") AS income, (SELECT COUNT(*)::integer FROM "RecurringFixedExpense") AS rules, (SELECT COUNT(*)::integer FROM "FixedExpense" WHERE "recurringId"='rule') AS generated`);
      assert.deepEqual(cashflow[0], { income: 1, rules: 1, generated: 1 });
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
