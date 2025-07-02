import { Router } from "express";
import UserService from "../services/UsersService";
import createUserRoutes from "./userRoutes";
import UsersController from "../controllers/UsersController";
import { prisma } from "../utils/prisma";
import { AccountService } from "../services/AccountService";
import AccountController from "../controllers/AccountController";
import createAccountRoutes from "./accountRoutes";

const router = Router();

// create services
const userService = new UserService(prisma);
const accountService = new AccountService(prisma);

// inject services into controllers
const userController = new UsersController(userService);
const accountController = new AccountController(accountService);

// Register routes
const userRoutes = createUserRoutes(userController);
const accountRoutes = createAccountRoutes(accountController);

// Routes
router.use("/users", userRoutes);
router.use("/accounts", accountRoutes);

export default router;
