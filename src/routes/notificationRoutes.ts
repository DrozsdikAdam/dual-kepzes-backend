import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
     getNotifications,
     getNotificationById,
     markAsRead,
     markAllAsRead,
     deleteNotification,
     archiveNotification,
     getArchivedNotifications,
     unarchiveNotification,
     createNotification
} from "../controllers/notificationController";

const router = Router();

router.use(authenticateToken); // Minden értesítés route védett

// Alapvető műveletek
router.get("/", getNotifications); // Olvasatlan/Aktív értesítések
router.get("/archived", getArchivedNotifications); // Archiváltak
router.get("/:id", getNotificationById);

// Műveletek
router.put("/read-all", markAllAsRead); // Összes olvasottnak jelölése
router.put("/:id/read", markAsRead); // Egy olvasottnak jelölése
router.put("/:id/archive", archiveNotification); // Archiválás
router.put("/:id/unarchive", unarchiveNotification); // Visszaállítás az archívumból

router.delete("/:id", deleteNotification); // Törlés (Soft delete + Archive)

// Teszteléshez vagy saját magunknak küldéshez
router.post("/", createNotification);

export default router;
