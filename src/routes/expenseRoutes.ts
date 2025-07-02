import { Router } from "express";
import ExpenseController from "../controllers/ExpenseController";
import { authenticateToken } from "../middlewares/auth";

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
   *     security:
   *       - bearerAuth: []
   */
  router.post("/", authenticateToken, expenseController.createExpense);

  /**
   * @swagger
   * /expenses:
   *   get:
   *     summary: Get all expenses for a user
   *     tags: [Expenses]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/", authenticateToken, expenseController.getExpensesByUserId);

  /**
   * @swagger
   * /expenses/{id}:
   *   get:
   *     summary: Get expense by ID
   *     tags: [Expenses]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/:id", authenticateToken, expenseController.getExpenseById);

  /**
   * @swagger
   * /expenses/{id}:
   *   put:
   *     summary: Update an expense
   *     tags: [Expenses]
   *     security:
   *       - bearerAuth: []
   */
  router.put("/:id", authenticateToken, expenseController.updateExpense);

  /**
   * @swagger
   * /expenses/{id}:
   *   delete:
   *     summary: Delete an expense
   *     tags: [Expenses]
   *     security:
   *       - bearerAuth: []
   */
  router.delete("/:id", authenticateToken, expenseController.deleteExpense);

  /**
   * @swagger
   * /expenses/recurring:
   *   post:
   *     summary: Create a recurring expense
   *     tags: [Recurring Expenses]
   *     security:
   *       - bearerAuth: []
   */
  router.post(
    "/recurring",
    authenticateToken,
    expenseController.createRecurringExpense
  );

  /**
   * @swagger
   * /expenses/recurring/all:
   *   get:
   *     summary: Get all recurring expenses
   *     tags: [Recurring Expenses]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/recurring/all",
    authenticateToken,
    expenseController.getRecurringExpensesByUserId
  );

  /**
   * @swagger
   * /expenses/summary:
   *   get:
   *     summary: Get expense summary
   *     tags: [Expenses]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/summary",
    authenticateToken,
    expenseController.getExpenseSummary
  );

  return router;
}
