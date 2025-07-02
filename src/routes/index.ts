import { Router } from "express";
import UserService from "../services/UsersService";
import createUserRoutes from "./userRoutes";
import UsersController from "../controllers/UsersController";
import { prisma } from "../utils/prisma";

const router = Router();

// create services
const userService = new UserService(prisma);

// inject services into controllers
const userController = new UsersController(userService);

// Register routes
const userRoutes = createUserRoutes(userController);

// Routes
router.use("/users", userRoutes);

export default router;
