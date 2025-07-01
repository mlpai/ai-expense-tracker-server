import { Request, Response } from "express";
import UsersService from "../services/UsersService";

export default class UsersController {
  static getAllUsers(req: Request, res: Response) {
    const users = UsersService.getAllUsers();
    res.json(users);
  }

  static getUserById(req: Request, res: Response) {
    const user = UsersService.getUserById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  }
}
