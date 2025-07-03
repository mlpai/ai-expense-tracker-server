import { Router } from "express";
import UserService from "../services/UsersService";
import createUserRoutes from "./userRoutes";
import UsersController from "../controllers/UsersController";
import { prisma } from "../utils/prisma";
import { AccountService } from "../services/AccountService";
import AccountController from "../controllers/AccountController";
import createAccountRoutes from "./accountRoutes";
import { DepositService } from "../services/DepositService";
import DepositController from "../controllers/DepositController";
import createDepositRoutes from "./depositRoutes";
import { ExpenseService } from "../services/ExpenseService";
import ExpenseController from "../controllers/ExpenseController";
import createExpenseRoutes from "./expenseRoutes";
import { ReceiptService } from "../services/ReceiptService";
import ReceiptController from "../controllers/ReceiptController";
import createReceiptRoutes from "./receiptRoutes";
import { BudgetService } from "../services/BudgetService";
import BudgetController from "../controllers/BudgetController";
import createBudgetRoutes from "./budgetRoutes";
import { AiService } from "../services/AiService";
import AiController from "../controllers/AiController";
import createAiRoutes from "./aiRoutes";
import { ExpenseCategoryService } from "../services/ExpenseCategoryService";
import ExpenseCategoryController from "../controllers/ExpenseCategoryController";
import createExpenseCategoryRoutes from "./expenseCategoryRoutes";
import cronDebugRoutes from "./cronDebugRoutes";

const router = Router();

// create services
const userService = new UserService(prisma);
const accountService = new AccountService(prisma);
const depositService = new DepositService(prisma);
const expenseService = new ExpenseService(prisma);
const receiptService = new ReceiptService(prisma);
const budgetService = new BudgetService(prisma);
const aiService = new AiService(prisma);
const expenseCategoryService = new ExpenseCategoryService(prisma);

// inject services into controllers
const userController = new UsersController(userService);
const accountController = new AccountController(accountService);
const depositController = new DepositController(depositService);
const expenseController = new ExpenseController(expenseService);
const receiptController = new ReceiptController(receiptService);
const budgetController = new BudgetController(budgetService);
const aiController = new AiController(aiService);
const expenseCategoryController = new ExpenseCategoryController(
  expenseCategoryService
);

// Register routes
const userRoutes = createUserRoutes(userController);
const accountRoutes = createAccountRoutes(accountController);
const depositRoutes = createDepositRoutes(depositController);
const expenseRoutes = createExpenseRoutes(expenseController);
const receiptRoutes = createReceiptRoutes(receiptController);
const budgetRoutes = createBudgetRoutes(budgetController);
const aiRoutes = createAiRoutes(aiController);
const expenseCategoryRoutes = createExpenseCategoryRoutes(
  expenseCategoryController
);

// Routes
router.use("/users", userRoutes);
router.use("/accounts", accountRoutes);
router.use("/deposits", depositRoutes);
router.use("/expenses", expenseRoutes);
router.use("/receipts", receiptRoutes);
router.use("/budgets", budgetRoutes);
router.use("/ai", aiRoutes);
router.use("/expense-categories", expenseCategoryRoutes);
router.use("/cron-debug", cronDebugRoutes);

export default router;
