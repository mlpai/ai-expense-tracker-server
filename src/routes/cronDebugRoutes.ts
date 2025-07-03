import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import { CronDebugController } from "../controllers/ExpenseController";

const cronDebugController = new CronDebugController();
const router = Router();

router.post("/all", authenticateToken, cronDebugController.runAllCrons);
router.post(
  "/recurring",
  authenticateToken,
  cronDebugController.runProcessRecurringExpenses
);
router.post(
  "/monthly-reports",
  authenticateToken,
  cronDebugController.runGenerateMonthlyReports
);
router.post(
  "/ai-suggestions",
  authenticateToken,
  cronDebugController.runGenerateAiSuggestions
);
router.post(
  "/budget-thresholds",
  authenticateToken,
  cronDebugController.runCheckBudgetThresholds
);
router.post(
  "/cleanup-notifications",
  authenticateToken,
  cronDebugController.runCleanupOldNotifications
);

export default router;
