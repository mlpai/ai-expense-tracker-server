import { User } from "../../generated/prisma";
import UserService from "../services/UsersService";
import { Request, Response } from "express";

export default class UsersController {
  private userService: UserService;
  constructor(userService: UserService) {
    this.userService = userService;
  }

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Error getting users",
      });
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.getUserById(req.params.id as string);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      userData.passwordHash = req.body.password;
      delete userData.password;
      const { passwordHash, email, name } = userData;
      const result = await this.userService.createUser({
        name,
        email,
        passwordHash,
      } as User);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Invalid user data",
      });
    }
  };

  loginUser = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.loginUser(
        req.body.email,
        req.body.password
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Invalid email or password",
      });
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const user = await this.userService.getUserById(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Error getting user profile",
      });
    }
  };
}
