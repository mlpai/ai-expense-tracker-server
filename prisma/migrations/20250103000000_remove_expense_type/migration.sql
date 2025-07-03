-- Step 1: Add categoryId column to Expense table (nullable initially)
ALTER TABLE "Expense" ADD COLUMN "categoryId" TEXT;

-- Step 2: Migrate data from ExpenseType to ExpenseCategory
-- Update Expense records to use the categoryId from their associated ExpenseType
UPDATE "Expense" 
SET "categoryId" = (
  SELECT "categoryId" 
  FROM "ExpenseType" 
  WHERE "ExpenseType"."id" = "Expense"."expenseTypeId"
);

-- Step 3: Add categoryId column to RecurringExpense table (nullable initially)
ALTER TABLE "RecurringExpense" ADD COLUMN "categoryId" TEXT;

-- Step 4: Migrate data from ExpenseType to ExpenseCategory for RecurringExpense
UPDATE "RecurringExpense" 
SET "categoryId" = (
  SELECT "categoryId" 
  FROM "ExpenseType" 
  WHERE "ExpenseType"."id" = "RecurringExpense"."expenseTypeId"
);

-- Step 5: Make categoryId columns NOT NULL
ALTER TABLE "Expense" ALTER COLUMN "categoryId" SET NOT NULL;

ALTER TABLE "RecurringExpense"
ALTER COLUMN "categoryId"
SET
    NOT NULL;

-- Step 6: Add foreign key constraints
ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RecurringExpense"
ADD CONSTRAINT "RecurringExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Drop old foreign key constraints
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_expenseTypeId_fkey";

ALTER TABLE "RecurringExpense"
DROP CONSTRAINT "RecurringExpense_expenseTypeId_fkey";

-- Step 8: Drop old columns
ALTER TABLE "Expense" DROP COLUMN "expenseTypeId";

ALTER TABLE "RecurringExpense" DROP COLUMN "expenseTypeId";

-- Step 9: Drop ExpenseType table
DROP TABLE "ExpenseType";

-- Step 10: Drop the relationship from ExpenseCategory to ExpenseType
-- (This is handled by the schema change)