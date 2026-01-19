import { Router } from "express";
import {
     archiveNews,
     createNews,
     deleteNews,
     getAdminNews,
     getAdminNewsById,
     getArchivedNews,
     getUserNews,
     getUserNewsById,
     unarchiveNews,
     updateNews,
} from "../controllers/newsController";
import { authenticateToken, isSystemAdmin } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { CreateNewsSchema, UpdateNewsSchema } from "../schemas/newsSchema";

const router = Router();

router.use(authenticateToken);

// User routes
router.get("/", getUserNews);
router.get("/:id", getUserNewsById);

// Admin routes
router.post("/admin", validate(CreateNewsSchema), createNews);
router.get("/admin", getAdminNews);
router.get("/admin/archived", getArchivedNews);
router.get("/admin/:id", getAdminNewsById);
router.patch("/admin/:id", validate(UpdateNewsSchema), updateNews);
router.patch("/admin/:id/archive", archiveNews);
router.patch("/admin/:id/unarchive", unarchiveNews);
router.delete("/admin/:id", deleteNews);

export default router;