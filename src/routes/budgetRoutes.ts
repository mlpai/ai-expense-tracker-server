import { Router } from "express";
import BudgetController from "../controllers/BudgetController";

export default function createBudgetRoutes(budgetController: BudgetController) {
  const router = Router();

  /**
   * @swagger
   * /budget:
   *   post:
   *     summary: Create a budget
   *     tags: [Budgets]
   */
  router.post("/", budgetController.createBudget);

  /**
   * @swagger
   * /budget:
   *   get:
   *     summary: Get all budgets for a user
   *     tags: [Budgets]
   */
  router.get("/", budgetController.getBudgetsByUserId);

  /**
   * @swagger
   * /budget/{id}:
   *   get:
   *     summary: Get budget by ID
   *     tags: [Budgets]
   */
  router.get("/:id", budgetController.getBudgetById);

  /**
   * @swagger
   * /budget/{id}:
   *   put:
   *     summary: Update a budget
   *     tags: [Budgets]
   */
  router.put("/:id", budgetController.updateBudget);

  /**
   * @swagger
   * /budget/{id}:
   *   delete:
   *     summary: Delete a budget
   *     tags: [Budgets]
   */
  router.delete("/:id", budgetController.deleteBudget);

  /**
   * @swagger
   * /budget/current:
   *   get:
   *     summary: Get current month budget
   *     tags: [Budgets]
   */
  router.get("/current", budgetController.getCurrentBudget);

  /**
   * @swagger
   * /budget/alerts/all:
   *   get:
   *     summary: Get all budget alerts
   *     tags: [Budgets]
   */
  router.get("/alerts/all", budgetController.getBudgetAlerts);

  /**
   * @swagger
   * /budget/alerts/{id}/read:
   *   put:
   *     summary: Mark alert as read
   *     tags: [Budgets]
   */
  router.put("/alerts/:id/read", budgetController.markAlertAsRead);

  /**
   * @swagger
   * /budget/summary/all:
   *   get:
   *     summary: Get budget summary
   *     tags: [Budgets]
   */
  router.get("/summary/all", budgetController.getBudgetSummary);

  /**
   * @swagger
   * /budget/{id}/recalc:
   *   put:
   *     summary: Recalculate budget spending
   *     tags: [Budgets]
   */
  router.put("/:id/recalc", budgetController.recalculateBudgetSpending);

  return router;
}
