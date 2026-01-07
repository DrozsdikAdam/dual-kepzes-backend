import { Router } from "express";
import { createCompany, createPosition } from "../controllers/jobController";
import { validate } from "../middlewares/validateMiddleware";
import {
  CompanyCreateSchema,
  PositionCreateSchema,
} from "../schemas/jobSchema";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post(
  "/companies",
  authenticateToken,
  validate(CompanyCreateSchema),
  createCompany
);
router.post(
  "/positions",
  authenticateToken,
  validate(PositionCreateSchema),
  createPosition
);

export default router;
