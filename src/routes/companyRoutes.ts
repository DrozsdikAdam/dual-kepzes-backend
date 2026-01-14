import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { getInactiveCompanies, reactivateCompany, deactivateCompany } from "../controllers/companyController";

const router = Router();

// Minden routehoz szükséges a bejelentkezés, de SystemAdmin jog nem (egyelőre)
router.use(authenticateToken);

router.get("/inactive", getInactiveCompanies);
router.patch("/:id/reactivate", reactivateCompany);
router.patch("/:id/deactivate", deactivateCompany);

export default router;
