
import { Router } from "express";
import {
    deletePartnership,
    getAllPartnerships,
    getPartnershipById,
    updatePartnership,
    terminatePartnership
} from "../controllers/dualController";
import { validate } from "../middlewares/validateMiddleware";
import {
    DualPartnershipUpdateSchema,
} from "../schemas/dualSchema";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/",
    authenticateToken,
    getAllPartnerships
);

router.get("/:id",
    authenticateToken,
    getPartnershipById
);

router.patch(
    "/:id",
    authenticateToken,
    validate(DualPartnershipUpdateSchema),
    updatePartnership
);

router.patch(
    "/:id/terminate",
    authenticateToken,
    terminatePartnership
);

router.delete("/:id",
    authenticateToken,
    deletePartnership
);

export default router;
