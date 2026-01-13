import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { getSystemStats } from "../controllers/statsController";

const router = Router();

// Csak bejelentkezett felhasználók láthatják
router.get("/", /*authenticateToken,*/ getSystemStats);

export default router;