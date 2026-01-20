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
import { CreateApplicationSchema, EvaluateApplicationSchema, UpdateApplicationSchema } from "../schemas/applicationSchema";

const router = Router();

router.use(authenticateToken)

// Student routes
router.post("/", validate(CreateApplicationSchema), applyToPosition)
router.get("/", getMyApplications)
router.patch("/:id/retract", retractApplication)

// Company routes
router.get("/company", getMyCompanyApplications)
router.patch("/company/:id/evaluate", validate(EvaluateApplicationSchema), evaluateApplication)
router.patch("/company/:id", validate(UpdateApplicationSchema), updateEvaluation)

// System Admin routes
router.get("/admin", getApplications)
router.get("/admin/:id", getApplication)
router.patch("/admin/:id", validate(UpdateApplicationSchema), updateApplication)

export default router;