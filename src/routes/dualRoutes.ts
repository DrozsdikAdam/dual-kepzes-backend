
import { Router } from "express";
import {
    deletePartnership,
    getAllPartnerships,
    getPartnershipById,
    updatePartnership,
    terminatePartnership,
    assignMentor,
    assignUniversityUser
} from "../controllers/dualController";
import { validate } from "../middlewares/validateMiddleware";
import {
    AssignMentorSchema,
    AssignUniversityUserSchema,
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
    "/:id/assign-mentor",
    authenticateToken,
    validate(AssignMentorSchema),
    assignMentor
);

router.patch(
    "/:id/assign-university-user",
    authenticateToken,
    validate(AssignUniversityUserSchema),
    assignUniversityUser
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
