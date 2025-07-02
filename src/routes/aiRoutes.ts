import { Router } from "express";
import AiController from "../controllers/AiController";

export default function createAiRoutes(aiController: AiController) {
  const router = Router();

  /**
   * @swagger
   * /ai/report:
   *   post:
   *     summary: Generate monthly report
   *     tags: [AI]
   */
  router.post("/report", aiController.generateMonthlyReport);

  /**
   * @swagger
   * /ai/suggestions/generate:
   *   post:
   *     summary: Generate AI suggestions
   *     tags: [AI]
   */
  router.post("/suggestions/generate", aiController.generateAiSuggestions);

  /**
   * @swagger
   * /ai/suggestions/all:
   *   get:
   *     summary: Get all AI suggestions
   *     tags: [AI]
   */
  router.get("/suggestions/all", aiController.getAiSuggestions);

  /**
   * @swagger
   * /ai/suggestions/{id}/read:
   *   put:
   *     summary: Mark suggestion as read
   *     tags: [AI]
   */
  router.put("/suggestions/:id/read", aiController.markSuggestionAsRead);

  return router;
}
