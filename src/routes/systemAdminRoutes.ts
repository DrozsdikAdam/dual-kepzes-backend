import { Router } from "express"
import { validate } from "../middlewares/validateMiddleware"
import {
     getSystemAdminById,
     getSystemAdmins,
     updateSystemAdminById,
     deleteSystemAdmin,
     getMeSystemAdmin,
     updateMeSystemAdmin,
     deleteMeSystemAdmin
} from "../controllers/systemAdminController"
import { systemAdminUpdateSchema } from "../schemas/systemAdminSchema"
import { authenticateToken } from "../middlewares/authMiddleware"

const router = Router()

router.use(authenticateToken)

router.get("/me", getMeSystemAdmin)
router.patch("/me", validate(systemAdminUpdateSchema), updateMeSystemAdmin)
router.delete("/me", deleteMeSystemAdmin)

router.get("/", getSystemAdmins)

router.get("/:id", getSystemAdminById)

router.patch("/:id", validate(systemAdminUpdateSchema), updateSystemAdminById)

router.delete("/:id", deleteSystemAdmin)

export default router