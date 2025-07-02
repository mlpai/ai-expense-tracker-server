import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utils/swagger";
import router from "./routes";
import fs from "fs";
import path from "path";
import { prisma } from "./utils/prisma";
import CronJobs from "./cron";

dotenv.config();

function createApp() {
  // date wise file name
  const errorLogPath = path.join(
    __dirname,
    "logs",
    `${new Date().toISOString().split("T")[0]}.log`
  );

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files (for uploaded receipts)
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "../public/uploads"))
  );

  // health check
  app.get("/health", (req, res) => {
    // retrun a healthy response with info about server
    res.status(200).json({
      message: "[OK] Server is healthy.",
    });
  });

  // API routes
  app.use("/api/v1", router);

  // Swagger JSON endpoint (must come before Swagger UI)
  app.get("/api-docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Swagger docs
  app.use(
    "/api-docs",
    swaggerUi.serve as any,
    swaggerUi.setup(swaggerSpec) as any
  );

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // Error handler
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      // write to error log file in best way
      fs.appendFileSync(
        errorLogPath,
        `${new Date().toISOString()} - ${err.stack}\n\n`
      );

      res.status(500).json({ message: "Internal Server Error" });
    }
  );

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);

    // Start cron jobs
    const cronJobs = new CronJobs();
    cronJobs.start();
  });
}

createApp();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
