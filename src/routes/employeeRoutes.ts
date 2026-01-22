import { Router } from "express";
import { deleteEmployeeById, getCompanyEmployees, getEmployeeById, updateEmployeeById, getMeEmployee, updateMeEmployee, deleteMeEmployee, getMyStudents } from "../controllers/employeeController";
import { UpdateEmployeeSchema } from "../schemas/employeeSchema";
import { validate } from "../middlewares/validateMiddleware";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.get("/me", authenticateToken, getMeEmployee);
router.patch("/me", authenticateToken, validate(UpdateEmployeeSchema), updateMeEmployee);

router.delete("/me", authenticateToken, deleteMeEmployee);

router.get("/me/students", authenticateToken, getMyStudents);

router.get("/", authenticateToken, getCompanyEmployees)

router.get("/:id", authenticateToken, getEmployeeById)

router.patch("/:id", authenticateToken, validate(UpdateEmployeeSchema), updateEmployeeById);

router.delete("/:id", authenticateToken, deleteEmployeeById)

export default router;