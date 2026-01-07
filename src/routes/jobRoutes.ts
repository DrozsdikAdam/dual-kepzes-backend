import { Router } from "express";
import { createCompany, createPosition, deleteCompany, deletePosition, updateCompany, updatePosition } from "../controllers/jobController";
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

router.delete('/companies/:id',
    authenticateToken,
    deleteCompany
);

router.delete('/positions/:id',
    authenticateToken,
    deletePosition
);

export default router;
