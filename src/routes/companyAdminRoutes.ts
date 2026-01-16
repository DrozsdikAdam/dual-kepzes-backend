import { Router } from "express"
import { validate } from "../middlewares/validateMiddleware"
import {
     getCompanyAdminById,
     getCompanyAdmins,
     updateCompanyAdminById,
     deleteCompanyAdmin,
     getMeCompanyAdmin,
     updateMeCompanyAdmin,
     deleteMeCompanyAdmin
} from "../controllers/companyAdminController"
import { companyAdminUpdateSchema } from "../schemas/companyAdminSchema"
import { authenticateToken } from "../middlewares/authMiddleware"

const router = Router()

router.use(authenticateToken)

router.get("/me", getMeCompanyAdmin)
router.patch("/me", validate(companyAdminUpdateSchema), updateMeCompanyAdmin)
router.delete("/me", deleteMeCompanyAdmin)

router.get("/", getCompanyAdmins)

router.get("/:id", getCompanyAdminById)

router.patch("/:id", validate(companyAdminUpdateSchema), updateCompanyAdminById)

router.delete("/:id", deleteCompanyAdmin)

export default router
