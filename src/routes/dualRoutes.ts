
import { Router } from "express";
import {
    deletePartnership,
    getAllPartnerships,
    getPartnershipById,
    updatePartnership,
} from "../controllers/dualController";
import { validate } from "../middlewares/validateMiddleware";
import {
    DualPartnershipUpdateSchema,
} from "../schemas/dualSchema";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/partnerships",
    authenticateToken,
    getAllPartnerships
);

router.get("/partnerships/:id",
    authenticateToken,
    getPartnershipById
);

router.patch(
    "/partnerships/:id",
    authenticateToken,
    validate(DualPartnershipUpdateSchema),
    updatePartnership
);

router.delete("/partnerships/:id",
    authenticateToken,
    deletePartnership
);

export default router;
