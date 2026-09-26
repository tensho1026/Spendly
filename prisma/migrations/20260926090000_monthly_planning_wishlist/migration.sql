CREATE TABLE "MonthlyPlan" (
    "month" TEXT NOT NULL,
    "livingBudget" INTEGER,
    "reflection" TEXT NOT NULL DEFAULT '',
    "closedAt" TIMESTAMP(3),
    "closedFingerprint" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MonthlyPlan_pkey" PRIMARY KEY ("month"),
    CONSTRAINT "MonthlyPlan_budget_nonnegative" CHECK ("livingBudget" IS NULL OR "livingBudget" >= 0)
);
CREATE TABLE "WishItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "memo" TEXT NOT NULL DEFAULT '',
    "purchasedAt" TIMESTAMP(3),
    "dailyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WishItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WishItem_amount_positive" CHECK ("amount" > 0)
);
CREATE INDEX "WishItem_purchasedAt_createdAt_idx" ON "WishItem"("purchasedAt", "createdAt");
CREATE INDEX "WishItem_dailyId_idx" ON "WishItem"("dailyId");
ALTER TABLE "WishItem" ADD CONSTRAINT "WishItem_dailyId_fkey" FOREIGN KEY ("dailyId") REFERENCES "DailyExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
