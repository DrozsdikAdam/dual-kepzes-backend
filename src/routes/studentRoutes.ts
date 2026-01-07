import { Router } from "express"
import { authenticateToken } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { getAllStudents, updateSutdent } from "../controllers/studentController";
import { StudentUpdateSchema } from "../schemas/studentSchema";

const router = Router();

router.get("/", authenticateToken, getAllStudents);

router.put("/:id", authenticateToken, validate(StudentUpdateSchema), updateSutdent);

export default router;