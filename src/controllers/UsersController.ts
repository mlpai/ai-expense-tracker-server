import { User } from "../models/user.models";
import UserService from "../services/UsersService";
import { Request, Response } from "express";

export default class UsersController {
  private userService: UserService;
  constructor(userService: UserService) {
    this.userService = userService;
  }

  getAllUsers = async (req: Request, res: Response) => {
    const users = await this.userService.getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  };

  getUserById = async (req: Request, res: Response) => {
    const user = await this.userService.getUserById(Number(req.params.id));
    res.status(200).json({
      success: true,
      data: user,
    });
  };

  createUser = async (req: Request, res: Response) => {
    const user = await this.userService.createUser(req.body as User);
    res.status(201).json({
      success: true,
      data: user,
    });
  };

  loginUser = async (req: Request, res: Response) => {
    const user = await this.userService.loginUser(
      req.body.email,
      req.body.password
    );
    res.status(200).json({
      success: true,
      data: user,
    });
  };
}
