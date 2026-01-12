import express, { Application, Request, Response } from "express";
import cors from "cors";

import { securityMiddleware } from "./middlewares/securityMiddleware";
import {
    apiRateLimiter,
    authRateLimiter,
} from "./middlewares/rateLimitMiddleware";
import { errorHandler } from "./middlewares/errorMiddleware";

import authRoutes from "./routes/authRoutes";
import jobRoutes from "./routes/jobRoutes";
import studentRoutes from "./routes/studentRoutes";
import statsRoutes from "./routes/statsRoutes";


const app: Application = express();
app.set("trust proxy", 1);
// Global Middlewares
app.use(securityMiddleware);
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api", apiRateLimiter);
app.use("/api/jobs", jobRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/stats", statsRoutes);


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
