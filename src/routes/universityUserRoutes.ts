import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
     getUniversityUserById,
     getUniversityUsers,
     updateUniversityUserById,
     deleteUniversityUser
} from "../controllers/universityUserController";
import { validate } from "../middlewares/validateMiddleware";
import { UniversityUserUpdateSchema } from "../schemas/universityUserSchema";

const router = Router();

router.use(authenticateToken)

router.get("/", getUniversityUsers);

router.get("/:id", getUniversityUserById)

router.patch("/:id", validate(UniversityUserUpdateSchema), updateUniversityUserById)

router.delete("/:id", deleteUniversityUser)

export default router;