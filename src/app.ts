import express, { Application, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import jobRoutes from "./routes/jobRoutes";
import { securityMiddleware } from "./middlewares/securityMiddleware";
import {
  apiRateLimiter,
  authRateLimiter,
} from "./middlewares/rateLimitMiddleware";
import { errorHandler } from "./middlewares/errorMiddleware";

const app: Application = express();
app.set("trust proxy", 1);
// Global Middlewares
app.use(securityMiddleware);
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRateLimiter, authRoutes);

app.use("/api", apiRateLimiter);
app.use("/api/jobs", jobRoutes);
// Test Route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Duális Képzés Backend API",
    status: "Running",
    timestamp: new Date(),
  });
});

app.use(errorHandler);

export default app;
