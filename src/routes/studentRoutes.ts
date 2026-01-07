import { Router } from "express"
import { authenticateToken } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { getAllStudents, getMyProfile, updateMyProfile, updateSutdent } from "../controllers/studentController";
import { MyProfileUpdateSchema, StudentUpdateSchema } from "../schemas/studentSchema";

const router = Router();

router.get("/", authenticateToken, getAllStudents);

router.put("/:id", authenticateToken, validate(StudentUpdateSchema), updateSutdent);

router.get('/me', authenticateToken, getMyProfile);

router.put('/me', authenticateToken, validate(MyProfileUpdateSchema), updateMyProfile);

export default router;