-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "dailyId" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DailyExpense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedMonth" (
    "month" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedMonth_pkey" PRIMARY KEY ("month")
);

-- CreateTable
CREATE TABLE "FixedExpense" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "memo" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FixedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyExpense_date_key" ON "DailyExpense"("date");

-- CreateIndex
CREATE INDEX "FixedExpense_month_idx" ON "FixedExpense"("month");

-- CreateIndex
CREATE INDEX "FixedExpense_categoryId_idx" ON "FixedExpense"("categoryId");

-- CreateIndex
CREATE INDEX "Expense_dailyId_idx" ON "Expense"("dailyId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_dailyId_fkey" FOREIGN KEY ("dailyId") REFERENCES "DailyExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_month_fkey" FOREIGN KEY ("month") REFERENCES "FixedMonth"("month") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve existing entries, grouping by their Japanese calendar day.
INSERT INTO "DailyExpense" ("id", "date", "total", "createdAt", "updatedAt")
SELECT 'day_' || to_char("date" + interval '9 hours', 'YYYY-MM-DD'),
       date_trunc('day', "date" + interval '9 hours') - interval '9 hours',
       SUM("amount")::integer, MIN("createdAt"), CURRENT_TIMESTAMP
FROM "Expense"
GROUP BY 1, 2;

UPDATE "Expense" SET "dailyId" = 'day_' || to_char("date" + interval '9 hours', 'YYYY-MM-DD');
