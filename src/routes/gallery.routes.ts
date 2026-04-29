import { Router } from "express";
import {
    getGalleries,
    createGalleryGroup,
    uploadGalleryImage,
    deleteGalleryGroup,
    deleteGalleryImage,
} from "../controllers/gallery.controller";
import { uploadImageMiddleware } from "../middlewares/upload.middleware";
import { authenticateToken, isSystemAdmin } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/galleries:
 *   get:
 *     summary: Galériák és képek listázása
 *     tags: [Gallery]
 *     responses:
 *       200:
 *         description: Sikeres lekérdezés
 */
// GET: Publikus végpont (mindenki láthatja a galériát)
router.get("/", getGalleries);

// POST: Új képcsoport / album létrehozása (csak Rendszeradminisztrátor)
router.post("/", authenticateToken, isSystemAdmin, createGalleryGroup);

/**
 * @swagger
 * /api/galleries/{groupId}/images:
 *   post:
 *     summary: Képek feltöltése a galéria csoportba (Csak SystemAdmin)
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       201:
 *         description: Kép feltöltve
 */
// POST: Képek feltöltése a csoportba
router.post(
    "/:groupId/images",
    authenticateToken,
    isSystemAdmin,
    uploadImageMiddleware.single("image"),
    uploadGalleryImage
);

/**
 * @swagger
 * /api/galleries/{groupId}:
 *   delete:
 *     summary: Egész képcsoport törlése (Csak SystemAdmin)
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Csoport törölve
 */
// DELETE: Egész képcsoport törlése
router.delete("/:groupId", authenticateToken, isSystemAdmin, deleteGalleryGroup);

/**
 * @swagger
 * /api/galleries/images/{imageId}:
 *   delete:
 *     summary: Egyetlen galéria kép törlése (Csak SystemAdmin)
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kép törölve
 */
// DELETE: Egyetlen kép törlése
router.delete("/images/:imageId", authenticateToken, isSystemAdmin, deleteGalleryImage);

export default router;
