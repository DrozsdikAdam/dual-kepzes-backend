import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { getInactiveUsers, reactivateUser } from "../controllers/userController";

const router = Router();

// Minden routehoz szükséges a bejelentkezés, de SystemAdmin jog nem (egyelőre)
router.use(authenticateToken);

router.get("/inactive", getInactiveUsers);
router.patch("/:id/reactivate", reactivateUser);

export default router;
