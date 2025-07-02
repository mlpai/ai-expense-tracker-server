import { createHmac } from "crypto";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "../../generated/prisma";

export default class UserService {
  constructor(private prisma: PrismaClient) {}

  async getUserById(id: string) {
    // return only basic user info
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        bankAccounts: {
          select: {
            id: true,
            accountNumber: true,
            bankName: true,
          },
        },
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async createUser(user: User) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // use crypto to hash password
    const passwordHash = createHmac("sha256", process.env.PASSWORD_SALT || "")
      .update(user.passwordHash)
      .digest("hex");
    user.passwordHash = passwordHash;

    const newUser = await this.prisma.user.create({
      data: user,
    });

    // Generate JWT token for new user
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      token,
    };
  }

  async loginUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // use crypto to compare password
    const passwordHash = createHmac("sha256", process.env.PASSWORD_SALT || "")
      .update(password)
      .digest("hex");
    const isPasswordValid = passwordHash === user.passwordHash;
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }
}
