import { Router } from "express";
import BudgetController from "../controllers/BudgetController";
import { authenticateToken } from "../middlewares/auth";

export default function createBudgetRoutes(budgetController: BudgetController) {
  const router = Router();

  /**
   * @swagger
   * /budget:
   *   post:
   *     summary: Create a budget
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.post("/", authenticateToken, budgetController.createBudget);

  /**
   * @swagger
   * /budget:
   *   get:
   *     summary: Get all budgets for a user
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/", authenticateToken, budgetController.getBudgetsByUserId);

  /**
   * @swagger
   * /budget/{id}:
   *   get:
   *     summary: Get budget by ID
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/:id", authenticateToken, budgetController.getBudgetById);

  /**
   * @swagger
   * /budget/{id}:
   *   put:
   *     summary: Update a budget
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.put("/:id", authenticateToken, budgetController.updateBudget);

  /**
   * @swagger
   * /budget/{id}:
   *   delete:
   *     summary: Delete a budget
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.delete("/:id", authenticateToken, budgetController.deleteBudget);

  /**
   * @swagger
   * /budget/current:
   *   get:
   *     summary: Get current month budget
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/current", authenticateToken, budgetController.getCurrentBudget);

  /**
   * @swagger
   * /budget/alerts/all:
   *   get:
   *     summary: Get all budget alerts
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/alerts/all",
    authenticateToken,
    budgetController.getBudgetAlerts
  );

  /**
   * @swagger
   * /budget/alerts/{id}/read:
   *   put:
   *     summary: Mark alert as read
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.put(
    "/alerts/:id/read",
    authenticateToken,
    budgetController.markAlertAsRead
  );

  /**
   * @swagger
   * /budget/summary/all:
   *   get:
   *     summary: Get budget summary
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/summary/all",
    authenticateToken,
    budgetController.getBudgetSummary
  );

  /**
   * @swagger
   * /budget/{id}/recalc:
   *   put:
   *     summary: Recalculate budget spending
   *     tags: [Budgets]
   *     security:
   *       - bearerAuth: []
   */
  router.put(
    "/:id/recalc",
    authenticateToken,
    budgetController.recalculateBudgetSpending
  );

  return router;
}
