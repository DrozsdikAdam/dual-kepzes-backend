import { Router } from "express";
import { createCompany, createPosition, updateCompany, updatePosition } from "../controllers/jobController";
import { validate } from "../middlewares/validateMiddleware";
import {
    CompanyCreateSchema,
    PositionCreateSchema,
    CompanyUpdateSchema,
    PositionUpdateSchema,
} from "../schemas/jobSchema";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post(
    "/companies",
    authenticateToken,
    validate(CompanyCreateSchema),
    createCompany
);
router.post(
    "/positions",
    authenticateToken,
    validate(PositionCreateSchema),
    createPosition
);

router.put(
    "/companies/:id",
    authenticateToken,
    validate(CompanyUpdateSchema),
    updateCompany
);

router.put(
    "/positions/:id",
    authenticateToken,
    validate(PositionUpdateSchema),
    updatePosition
);

export default router;
