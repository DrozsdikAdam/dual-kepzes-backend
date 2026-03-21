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

// GET: Publikus végpont (mindenki láthatja a galériát)
router.get("/", getGalleries);

// POST: Új képcsoport / album létrehozása (csak Rendszeradminisztrátor)
router.post("/", authenticateToken, isSystemAdmin, createGalleryGroup);

// POST: Képek feltöltése a csoportba
router.post(
    "/:groupId/images",
    authenticateToken,
    isSystemAdmin,
    uploadImageMiddleware.single("image"),
    uploadGalleryImage
);

// DELETE: Egész képcsoport törlése
router.delete("/:groupId", authenticateToken, isSystemAdmin, deleteGalleryGroup);

// DELETE: Egyetlen kép törlése
router.delete("/images/:imageId", authenticateToken, isSystemAdmin, deleteGalleryImage);

export default router;
