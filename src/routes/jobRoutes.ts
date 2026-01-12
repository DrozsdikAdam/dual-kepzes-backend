import { Router } from "express";
import {
    createCompany,
    createPosition,
    deleteCompany,
    deletePosition,
    getAllCompanies,
    getAllPositions,
    getCompanyById,
    getPositionById,
    updateCompany,
    updatePosition
} from "../controllers/jobController";
import { validate } from "../middlewares/validateMiddleware";
import {
    CompanyCreateSchema,
    PositionCreateSchema,
    CompanyUpdateSchema,
    PositionUpdateSchema,
} from "../schemas/jobSchema";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Cég végpontok
router.get("/companies",
    authenticateToken,
    getAllCompanies
);

router.get("/companies/:id",
    authenticateToken,
    getCompanyById
);

router.post(
    "/companies",
    authenticateToken,
    validate(CompanyCreateSchema),
    createCompany
);

router.patch(
    "/companies/:companyId",
    authenticateToken,
    validate(CompanyUpdateSchema),
    updateCompany
);

router.delete("/companies/:id",
    authenticateToken,
    deleteCompany
);

// Pozíció végpontok
router.get("/positions",
    authenticateToken,
    getAllPositions
);

router.get("/positions/:id",
    authenticateToken,
    getPositionById
);

router.post(
    "/positions",
    authenticateToken,
    validate(PositionCreateSchema),
    createPosition
);

router.patch(
    "/positions/:id",
    authenticateToken,
    validate(PositionUpdateSchema),
    updatePosition
);

router.delete("/positions/:id",
    authenticateToken,
    deletePosition
);

export default router;
