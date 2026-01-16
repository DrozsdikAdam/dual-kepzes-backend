import { Router } from "express";
import { applyToPosition, getMyApplications } from "../controllers/applicationController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { CreateApplicationSchema } from "../schemas/applicationSchema";

const router = Router();

router.use(authenticateToken)

router.post("/", validate(CreateApplicationSchema), applyToPosition)

router.get("/", getMyApplications)

export default router;