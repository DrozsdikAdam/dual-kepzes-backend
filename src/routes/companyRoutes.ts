import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
     getInactiveCompanies,
     reactivateCompany,
     deactivateCompany,
     getAllCompanies,
     getCompanyById,
     createCompany,
     updateCompany,
     deleteCompany
} from "../controllers/companyController";
import { validate } from "../middlewares/validateMiddleware";
import { CompanyCreateSchema, CompanyUpdateSchema } from "../schemas/jobSchema";

const router = Router();

// Minden routehoz szükséges a bejelentkezés
router.use(authenticateToken);

// Specifikus route-ok (id előtt kell lenniük)
router.get("/inactive", getInactiveCompanies);

// Általános CRUD route-ok
router.get("/", getAllCompanies);

router.post(
     "/",
     validate(CompanyCreateSchema),
     createCompany
);

router.get("/:id", getCompanyById);

// Fontos: a controllerben companyId-t vár, ezért itt is azt használunk a paraméterben,
// vagy egységesíteni kellene (de most követem a controller logikáját)
router.patch(
     "/:companyId",
     validate(CompanyUpdateSchema),
     updateCompany
);

router.delete("/:id", deleteCompany);

// Egyéb műveletek id alapján
router.patch("/:id/reactivate", reactivateCompany);
router.patch("/:id/deactivate", deactivateCompany);

export default router;
