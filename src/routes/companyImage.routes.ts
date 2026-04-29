import { Router } from "express";
import {
    uploadCompanyImage,
    getCompanyImages,
    deleteCompanyImage,
} from "../controllers/companyImage.controller";
import { uploadImageMiddleware } from "../middlewares/upload.middleware";
import { authenticateToken, isCompanyAdmin } from "../middlewares/auth.middleware";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/companies/{companyId}/images:
 *   get:
 *     summary: Céghez tartozó képek lekérdezése
 *     tags: [Company Images]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cég azonosítója
 *     responses:
 *       200:
 *         description: Sikeres lekérdezés
 */
// GET: Publikus végpont a céges képek listázására
router.get("/", getCompanyImages);

/**
 * @swagger
 * /api/companies/{companyId}/images:
 *   post:
 *     summary: Új kép feltöltése a céghez (Csak CompanyAdmin)
 *     tags: [Company Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cég azonosítója
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: A feltöltendő kép (max 5MB)
 *     responses:
 *       201:
 *         description: Kép sikeresen feltöltve
 */
// POST: Céges kép feltöltése (csak CompanyAdmin)
router.post(
    "/",
    authenticateToken,
    isCompanyAdmin,
    uploadImageMiddleware.single("image"),
    uploadCompanyImage
);

/**
 * @swagger
 * /api/companies/{companyId}/images/{imageId}:
 *   delete:
 *     summary: Céges kép törlése (Csak CompanyAdmin)
 *     tags: [Company Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kép törölve
 */
// DELETE: Törlés (csak CompanyAdmin)
router.delete(
    "/:imageId",
    authenticateToken,
    isCompanyAdmin,
    deleteCompanyImage
);

export default router;
