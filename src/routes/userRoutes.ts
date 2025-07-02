import { Router } from "express";
import UsersController from "../controllers/UsersController";

export default function createUserRoutes(userController: UsersController) {
  const router = Router();

  /**
   * @openapi
   * /api/v1/users:
   *   get:
   *     summary: Get all users
   *     description: Returns a list of all users
   *     responses:
   *       "200":
   *         description: A list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/User"
   *       "500":
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  router.get("/", userController.getAllUsers);

  /**
   * @openapi
   * /api/v1/users/{id}:
   *   get:
   *     summary: Get a user by ID
   *     description: Returns a user by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       "200":
   *         description: A user by ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       "404":
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  router.get("/:id", userController.getUserById);

  /**
   * @openapi
   * /api/v1/users:
   *   post:
   *     summary: Create a user
   *     description: Creates a new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User email address
   *               password:
   *                 type: string
   *                 description: User password (will be hashed)
   *               name:
   *                 type: string
   *                 description: User's full name
   *             required:
   *               - email
   *               - password
   *               - name
   *     responses:
   *       "201":
   *         description: User created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       "400":
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  router.post("/", userController.createUser);

  return router;
}
