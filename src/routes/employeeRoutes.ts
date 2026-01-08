import { Router } from "express";
import { deleteEmployeeById, getCompanyEmployees, updateEmployeeById } from "../controllers/employeeController";
import { UpdateEmployeeSchema } from "../schemas/employeeSchema";
import { validate } from "../middlewares/validateMiddleware";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.get('/', authenticateToken, getCompanyEmployees)

router.put("/:id", authenticateToken, validate(UpdateEmployeeSchema), updateEmployeeById);

router.delete("/:id", authenticateToken, deleteEmployeeById)

export default router;