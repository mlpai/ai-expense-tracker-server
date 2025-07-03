import { Router } from "express";
import AiController from "../controllers/AiController";
import { authenticateToken } from "../middlewares/auth";

export default function createAiRoutes(aiController: AiController) {
  const router = Router();

  /**
   * @swagger
   * /ai/report:
   *   post:
   *     summary: Generate monthly report
   *     tags: [AI]
   *     security:
   *       - bearerAuth: []
   */
  router.post("/report", authenticateToken, aiController.generateMonthlyReport);

  /**
   * @swagger
   * /ai/suggestions/generate:
   *   post:
   *     summary: Generate AI suggestions
   *     tags: [AI]
   *     security:
   *       - bearerAuth: []
   */
  router.post(
    "/suggestions/generate",
    authenticateToken,
    aiController.generateAiSuggestions
  );

  /**
   * @swagger
   * /ai/suggestions/all:
   *   get:
   *     summary: Get all AI suggestions
   *     tags: [AI]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/suggestions/all",
    authenticateToken,
    aiController.getAiSuggestions
  );

  /**
   * @swagger
   * /ai/suggestions/{id}/read:
   *   put:
   *     summary: Mark suggestion as read
   *     tags: [AI]
   *     security:
   *       - bearerAuth: []
   */
  router.put(
    "/suggestions/:id/read",
    authenticateToken,
    aiController.markSuggestionAsRead
  );

  /**
   * @swagger
   * /ai/reports:
   *   get:
   *     summary: List all user reports
   *     tags: [AI]
   *     security:
   *       - bearerAuth: []
   */
  router.get("/reports", authenticateToken, aiController.listUserReports);

  return router;
}
