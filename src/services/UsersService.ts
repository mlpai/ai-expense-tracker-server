import { PrismaClient } from "@prisma/client";
import { createHmac } from "crypto";
import { User } from "../../generated/prisma";

export default class UserService {
  constructor(private prisma: PrismaClient) {}

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        bankAccounts: true,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async createUser(user: User) {
    // use crypto to hash password
    const passwordHash = createHmac("sha256", process.env.PASSWORD_SALT || "")
      .update(user.passwordHash)
      .digest("hex");
    user.passwordHash = passwordHash;

    return this.prisma.user.create({
      data: user,
    });
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

    return user;
  }
}
