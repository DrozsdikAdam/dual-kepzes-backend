import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { getInactiveUsers, reactivateUser, deactivateUser } from "../controllers/userController";

const router = Router();

// Minden routehoz szükséges a bejelentkezés, de SystemAdmin jog nem (egyelőre)
router.use(authenticateToken);

router.get("/inactive", getInactiveUsers);
router.patch("/:id/reactivate", reactivateUser);
router.patch("/:id/deactivate", deactivateUser);

export default router;
