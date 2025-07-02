import { Router } from "express";
import ExpenseController from "../controllers/ExpenseController";

export default function createExpenseRoutes(
  expenseController: ExpenseController
) {
  const router = Router();

  /**
   * @swagger
   * /expenses:
   *   post:
   *     summary: Create a new expense
   *     tags: [Expenses]
   */
  router.post("/", expenseController.createExpense);

  /**
   * @swagger
   * /expenses:
   *   get:
   *     summary: Get all expenses for a user
   *     tags: [Expenses]
   */
  router.get("/", expenseController.getExpensesByUserId);

  /**
   * @swagger
   * /expenses/{id}:
   *   get:
   *     summary: Get expense by ID
   *     tags: [Expenses]
   */
  router.get("/:id", expenseController.getExpenseById);

  /**
   * @swagger
   * /expenses/{id}:
   *   put:
   *     summary: Update an expense
   *     tags: [Expenses]
   */
  router.put("/:id", expenseController.updateExpense);

  /**
   * @swagger
   * /expenses/{id}:
   *   delete:
   *     summary: Delete an expense
   *     tags: [Expenses]
   */
  router.delete("/:id", expenseController.deleteExpense);

  /**
   * @swagger
   * /expenses/recurring:
   *   post:
   *     summary: Create a recurring expense
   *     tags: [Recurring Expenses]
   */
  router.post("/recurring", expenseController.createRecurringExpense);

  /**
   * @swagger
   * /expenses/recurring/all:
   *   get:
   *     summary: Get all recurring expenses
   *     tags: [Recurring Expenses]
   */
  router.get("/recurring/all", expenseController.getRecurringExpensesByUserId);

  /**
   * @swagger
   * /expenses/summary:
   *   get:
   *     summary: Get expense summary
   *     tags: [Expenses]
   */
  router.get("/summary", expenseController.getExpenseSummary);

  return router;
}
