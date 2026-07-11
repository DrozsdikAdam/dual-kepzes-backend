import express, { Application, Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import path from "path";

import { securityMiddleware } from "./middlewares/security.middleware";
import { sanitizationMiddleware } from "./middlewares/sanitization.middleware";
import { corsOptions } from "./config/cors";
import {
    apiRateLimiter,
    authRateLimiter,
} from "./middlewares/rateLimit.middleware";
import { errorHandler } from "./middlewares/error.middleware";

import authRoutes from "./routes/auth.routes";
import jobRoutes from "./routes/job.routes";
import studentRoutes from "./routes/student.routes";
import statsRoutes from "./routes/stats.routes";
import systemAdminRoutes from "./routes/systemAdmin.routes";
import universityUserRoutes from "./routes/universityUser.routes";
import companyAdminRoutes from "./routes/companyAdmin.routes";
import genericUserRoutes from "./routes/user.routes";
import companyRoutes from "./routes/company.routes";
import employeeRoutes from "./routes/employee.routes";
import applicationRoutes from "./routes/application.routes";
import newsRoutes from "./routes/news.routes";
import notificationRoutes from "./routes/notification.routes";
import dualRoutes from "./routes/dual.routes";
import majorRoutes from "./routes/major.routes";
import locationRoutes from "./routes/location.routes";
import materialRoutes from "./routes/material.routes";
import galleryRoutes from "./routes/gallery.routes";
import companyImageRoutes from "./routes/companyImage.routes";
import searchRoutes from "./routes/search.routes";

const app: Application = express();
app.set("trust proxy", 1);
// Global Middlewares
app.use(cors(corsOptions));
app.use(securityMiddleware);
app.use(express.json());
app.use(sanitizationMiddleware);

// Serve static files from 'uploads' directory
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Auth Rate Limiter
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api", apiRateLimiter);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/stats", statsRoutes);

//user endpoints
app.use("/api/students", studentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/system-admins", systemAdminRoutes);
app.use("/api/company-admins", companyAdminRoutes);
app.use("/api/university-users", universityUserRoutes);
app.use("/api/users", genericUserRoutes);

//company endpoints
// A company router alá nesteljük be a companyImages-t (id előtt kell lennie, különben a companyRoutes authenticateToken-je elkapja)
app.use("/api/companies/:companyId/images", companyImageRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/locations", locationRoutes);

//news endpoints
app.use("/api/news", newsRoutes);

//application endpoints
app.use("/api/applications", applicationRoutes);

//notification endpoints
app.use("/api/notifications", notificationRoutes);

//partnership endpoints
app.use("/api/partnerships", dualRoutes);

//major endpoints
app.use("/api/majors", majorRoutes);

//material endpoints
app.use("/api/materials", materialRoutes);

//gallery endpoints
app.use("/api/galleries", galleryRoutes);

//search endpoints
app.use("/api/search", searchRoutes);

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
