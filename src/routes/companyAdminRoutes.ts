import { Router } from "express"
import { validate } from "../middlewares/validateMiddleware"
import {
     getCompanyAdminById,
     getCompanyAdmins,
     updateCompanyAdminById,
     deleteCompanyAdmin,
     getMeCompanyAdmin,
     updateMeCompanyAdmin,
     deleteMeCompanyAdmin,
     restoreCompanyAdmin
} from "../controllers/companyAdminController"
import { CompanyAdminUpdateSchema } from "../schemas/companyAdminSchema"
import { authenticateToken } from "../middlewares/authMiddleware"

const router = Router()

router.use(authenticateToken)

router.get("/me", getMeCompanyAdmin)
router.patch("/me", validate(CompanyAdminUpdateSchema), updateMeCompanyAdmin)
router.delete("/me", deleteMeCompanyAdmin)

router.get("/", getCompanyAdmins)

router.patch("/restore/:id", restoreCompanyAdmin)

router.get("/:id", getCompanyAdminById)

router.patch("/:id", validate(CompanyAdminUpdateSchema), updateCompanyAdminById)

router.delete("/:id", deleteCompanyAdmin)

export default router
