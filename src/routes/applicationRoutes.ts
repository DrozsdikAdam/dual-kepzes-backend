import { Router } from "express";
import {
     applyToPosition,
     evaluateApplication,
     getApplication,
     getApplications,
     getMyApplications,
     getMyCompanyApplications,
     retractApplication,
     updateApplication,
     updateEvaluation
} from "../controllers/applicationController";
import { authenticateToken, isCompanyEmployee, isStudent, isSystemAdmin } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { CreateApplicationSchema } from "../schemas/applicationSchema";

const router = Router();

router.use(authenticateToken)

// Student routes
router.post("/", validate(CreateApplicationSchema), applyToPosition)
router.get("/", getMyApplications)
router.patch("/:id/retract", retractApplication)

// Company routes
router.get("/company", getMyCompanyApplications)
router.patch("/company/:id/evaluate", evaluateApplication)
router.patch("/company/:id", updateEvaluation)

// System Admin routes
router.get("/admin", getApplications)
router.get("/admin/:id", getApplication)
router.patch("/admin/:id", updateApplication)

export default router;