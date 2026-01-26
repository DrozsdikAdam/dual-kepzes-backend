
import { Router } from "express";
import {
    deletePartnership,
    getPartnershipById,
    updatePartnership,
    terminatePartnership,
    assignMentor,
    assignUniversityUser,
    getStudentPartnerships,
    getCompanyPartnerships,
    getUniversityPartnerships
} from "../controllers/dualController";
import { validate } from "../middlewares/validateMiddleware";
import {
    AssignMentorSchema,
    AssignUniversityUserSchema,
    DualPartnershipUpdateSchema,
} from "../schemas/dualSchema";
import {
    authenticateToken,
    isCompanyEmployee,
    isStudent,
    isUniversityStaff
} from "../middlewares/authMiddleware";

const router = Router();

router.get("/student",
    authenticateToken,
    getStudentPartnerships
);

router.get("/company",
    authenticateToken,
    getCompanyPartnerships
);

router.get("/university",
    authenticateToken,
    getUniversityPartnerships
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
