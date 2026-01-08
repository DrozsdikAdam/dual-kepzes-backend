import { Router } from "express";
import { deleteEmployeeById, getCompanyEmployees, getEmployeeById, updateEmployeeById } from "../controllers/employeeController";
import { UpdateEmployeeSchema } from "../schemas/employeeSchema";
import { validate } from "../middlewares/validateMiddleware";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.get('/', authenticateToken, getCompanyEmployees)

router.get('/:id', authenticateToken, getEmployeeById)

router.put("/:id", authenticateToken, validate(UpdateEmployeeSchema), updateEmployeeById);

router.delete("/:id", authenticateToken, deleteEmployeeById)

export default router;