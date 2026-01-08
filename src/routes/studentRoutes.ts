import { Router } from "express"
import { authenticateToken } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import {
    getAllStudents,
    getMyProfile,
    updateMyProfile,
    updateStudentById,
    getStudentById,
    deleteMyProfile,
    deleteStudentById
} from "../controllers/studentController";
import { MyProfileUpdateSchema, StudentUpdateSchema } from "../schemas/studentSchema";

const router = Router();

router.get("/", authenticateToken, getAllStudents);

router.get('/me', authenticateToken, getMyProfile);

router.put('/me', authenticateToken, validate(MyProfileUpdateSchema), updateMyProfile);

router.delete('/me', authenticateToken, deleteMyProfile)

router.get("/:id", authenticateToken, getStudentById)

router.delete('/:id', authenticateToken, deleteStudentById)

router.put("/:id", authenticateToken, validate(StudentUpdateSchema), updateStudentById);




export default router;