import { Router } from "express";
import {
    createPosition,
    deletePosition,
    getAllPositions,
    getDualPositions,
    getNonDualPositions,
    getPositionById,
    updatePosition,
    deactivatePosition,
    getPositionsByCompanyId
} from "../controllers/jobController";
import { validate } from "../middlewares/validateMiddleware";
import {
    PositionCreateSchema,
    PositionUpdateSchema,
} from "../schemas/jobSchema";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Pozíció végpontok
router.get("/positions",
    getAllPositions
);

router.get("/positions/dual",
    getDualPositions
);

router.get("/positions/non-dual",
    getNonDualPositions
);

router.get("/positions/:id",
    getPositionById
);

router.get("/positions/company/:companyId",
    getPositionsByCompanyId
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

router.patch("/positions/:id/deactivate",
    authenticateToken,
    deactivatePosition
);

export default router;
