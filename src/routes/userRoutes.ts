import { Router } from "express";
import UsersController from "../controllers/UsersController";
import { authenticateToken } from "../middlewares/auth";

export default function createUserRoutes(userController: UsersController) {
  const router = Router();

  /**
   * @openapi
   * /api/v1/users:
   *   get:
   *     summary: Get all users
   *     description: Returns a list of all users
   *     tags:
   *       - Users
   *     responses:
   *       200:
   *         description: A list of users
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Indicates if the request was successful
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: User ID
   *                       email:
   *                         type: string
   *                         format: email
   *                         description: User email address
   *                       name:
   *                         type: string
   *                         description: User's full name
   *                       bankAccounts:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: string
   *                             accountNumber:
   *                               type: string
   *                             bankName:
   *                               type: string
   *                             balance:
   *                               type: number
   *                       expenses:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: string
   *                             amount:
   *                               type: number
   *                             description:
   *                               type: string
   *                             date:
   *                               type: string
   *                               format: date
   *                             category:
   *                               type: string
   *               required:
   *                 - success
   *                 - data
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   */
  router.get("/", userController.getAllUsers);

  /**
   * @openapi
   * /api/v1/users/{id}:
   *   get:
   *     summary: Get a user by ID
   *     description: Returns a user by ID
   *     tags:
   *       - Users
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the user
   *     responses:
   *       200:
   *         description: A user by ID
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Indicates if the request was successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: User ID
   *                     email:
   *                       type: string
   *                       format: email
   *                       description: User email address
   *                     name:
   *                       type: string
   *                       description: User's full name
   *                     bankAccounts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           accountNumber:
   *                             type: string
   *                           bankName:
   *                             type: string
   *                           balance:
   *                             type: number
   *                     expenses:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           amount:
   *                             type: number
   *                           description:
   *                             type: string
   *                           date:
   *                             type: string
   *                             format: date
   *                           category:
   *                             type: string
   *               required:
   *                 - success
   *                 - data
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   */
  router.get("/:id", userController.getUserById);

  /**
   * @openapi
   * /api/v1/users:
   *   post:
   *     summary: Create a user
   *     description: Creates a new user
   *     tags:
   *       - Users
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
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Indicates if the request was successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: User ID
   *                     email:
   *                       type: string
   *                       format: email
   *                       description: User email address
   *                     name:
   *                       type: string
   *                       description: User's full name
   *                     bankAccounts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           accountNumber:
   *                             type: string
   *                           bankName:
   *                             type: string
   *                           balance:
   *                             type: number
   *                     expenses:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           amount:
   *                             type: number
   *                           description:
   *                             type: string
   *                           date:
   *                             type: string
   *                             format: date
   *                           category:
   *                             type: string
   *               required:
   *                 - success
   *                 - data
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   */
  router.post("/", userController.createUser);

  /**
   * @openapi
   * /api/v1/users/login:
   *   post:
   *     summary: Login a user
   *     description: Logs in a user
   *     tags:
   *       - Users
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
   *                 description: User password
   *             required:
   *               - email
   *               - password
   *     responses:
   *       200:
   *         description: User logged in successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Indicates if the login was successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           description: User ID
   *                         email:
   *                           type: string
   *                           format: email
   *                           description: User email address
   *                         name:
   *                           type: string
   *                           description: User's full name
   *                     token:
   *                       type: string
   *                       description: JWT authentication token
   *                   required:
   *                     - user
   *                     - token
   *               required:
   *                 - success
   *                 - data
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   */
  router.post("/login", userController.loginUser);

  /**
   * @openapi
   * /api/v1/users/me:
   *   get:
   *     summary: Get current user profile
   *     description: Returns the current authenticated user's profile
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user profile
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Indicates if the request was successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: User ID
   *                     email:
   *                       type: string
   *                       format: email
   *                       description: User email address
   *                     name:
   *                       type: string
   *                       description: User's full name
   *                     bankAccounts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           accountNumber:
   *                             type: string
   *                           bankName:
   *                             type: string
   *                           balance:
   *                             type: number
   *               required:
   *                 - success
   *                 - data
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Error message
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *               required:
   *                 - message
   *                 - status
   */
  router.get("/me", authenticateToken, userController.getCurrentUser);

  return router;
}
