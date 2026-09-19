CREATE TABLE "CategoryBudget" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CategoryBudget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseTemplate" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "memo" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExpenseTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CategoryBudget_month_categoryId_key" ON "CategoryBudget"("month", "categoryId");
CREATE INDEX "CategoryBudget_month_idx" ON "CategoryBudget"("month");
CREATE INDEX "CategoryBudget_categoryId_idx" ON "CategoryBudget"("categoryId");
CREATE INDEX "ExpenseTemplate_categoryId_idx" ON "ExpenseTemplate"("categoryId");

ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseTemplate" ADD CONSTRAINT "ExpenseTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
