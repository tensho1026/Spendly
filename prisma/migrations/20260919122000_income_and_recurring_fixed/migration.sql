CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecurringFixedExpense" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "memo" TEXT,
    "dueDay" INTEGER NOT NULL,
    "startMonth" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecurringFixedExpense_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FixedMonth" ADD COLUMN "recurringGeneratedAt" TIMESTAMP(3);
ALTER TABLE "FixedExpense" ADD COLUMN "dueDay" INTEGER,
ADD COLUMN "recurringId" TEXT;

CREATE INDEX "Income_date_idx" ON "Income"("date");
CREATE INDEX "Income_type_idx" ON "Income"("type");
CREATE INDEX "FixedExpense_recurringId_idx" ON "FixedExpense"("recurringId");
CREATE UNIQUE INDEX "FixedExpense_month_recurringId_key" ON "FixedExpense"("month", "recurringId");
CREATE INDEX "RecurringFixedExpense_categoryId_idx" ON "RecurringFixedExpense"("categoryId");
CREATE INDEX "RecurringFixedExpense_startMonth_idx" ON "RecurringFixedExpense"("startMonth");

ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "RecurringFixedExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecurringFixedExpense" ADD CONSTRAINT "RecurringFixedExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
