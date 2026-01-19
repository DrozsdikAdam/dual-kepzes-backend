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
import systemAdminRoutes from "./routes/systemAdminRoutes";
import universityUserRoutes from "./routes/universityUserRoutes";
import companyAdminRoutes from "./routes/companyAdminRoutes";
import genericUserRoutes from "./routes/userRoutes";
import companyRoutes from "./routes/companyRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import newsRoutes from "./routes/newsRoutes";

const app: Application = express();
app.set("trust proxy", 1);
// Global Middlewares
app.use(securityMiddleware);
app.use(cors());
app.use(express.json());
// Auth Rate Limiter
app.use("/api/auth", authRoutes);
// app.use("/api", apiRateLimiter);


app.use("/api/stats", statsRoutes);

//user endpoints
app.use("/api/students", studentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/system-admins", systemAdminRoutes);
app.use("/api/company-admins", companyAdminRoutes);
app.use("/api/university-users", universityUserRoutes);
app.use("/api/users", genericUserRoutes);

//company endpoints
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);

//news endpoints
app.use("/api/news", newsRoutes);

//application endpoints
app.use("/api/applications", applicationRoutes);

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
