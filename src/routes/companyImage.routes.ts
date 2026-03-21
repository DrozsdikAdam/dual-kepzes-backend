import { Router } from "express";
import {
    uploadCompanyImage,
    getCompanyImages,
    deleteCompanyImage,
} from "../controllers/companyImage.controller";
import { uploadImageMiddleware } from "../middlewares/upload.middleware";
import { authenticateToken, isCompanyAdmin } from "../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

// GET: Publikus végpont a céges képek listázására
router.get("/", getCompanyImages);

// POST: Céges kép feltöltése (csak CompanyAdmin)
router.post(
    "/",
    authenticateToken,
    isCompanyAdmin,
    uploadImageMiddleware.single("image"),
    uploadCompanyImage
);

// DELETE: Törlés (csak CompanyAdmin)
router.delete(
    "/:imageId",
    authenticateToken,
    isCompanyAdmin,
    deleteCompanyImage
);

export default router;
