import { Router } from "express";
import { authenticateToken, isSystemAdmin } from "../middlewares/auth.middleware";
import {
     getNotifications,
     getNotificationById,
     markAsRead,
     markAllAsRead,
     deleteNotification,
     archiveNotification,
     getArchivedNotifications,
     unarchiveNotification,
     createNotification,
     getUnreadNotificationsCount
} from "../controllers/notification.controller";
import { requireNotificationOwnership } from "../middlewares/ownership.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: System and user notification management
 */

router.use(authenticateToken); // Minden értesítés route védett

// Alapvető műveletek

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List my active, non-archived notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get("/", getNotifications); // Olvasatlan/Aktív értesítések

/**
 * @swagger
 * /api/notifications/archived:
 *   get:
 *     summary: List my archived notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of archived notifications
 */
router.get("/archived", getArchivedNotifications); // Archiváltak

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of unread notifications
 */
router.get("/unread-count", getUnreadNotificationsCount);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification details by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification details
 */
router.get("/:id", getNotificationById);

// Műveletek

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all my notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put("/read-all", markAllAsRead); // Összes olvasottnak jelölése

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put("/:id/read", requireNotificationOwnership, markAsRead); // Egy olvasottnak jelölése

/**
 * @swagger
 * /api/notifications/{id}/archive:
 *   put:
 *     summary: Archive a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification archived successfully
 */
router.put("/:id/archive", requireNotificationOwnership, archiveNotification); // Archiválás

/**
 * @swagger
 * /api/notifications/{id}/unarchive:
 *   put:
 *     summary: Unarchive a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification unarchived successfully
 */
router.put("/:id/unarchive", requireNotificationOwnership, unarchiveNotification); // Visszaállítás az archívumból

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.delete("/:id", requireNotificationOwnership, deleteNotification); // Törlés (Soft delete + Archive)

// Teszteléshez vagy saját magunknak küldéshez

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a manual notification (System Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotification'
 *     responses:
 *       201:
 *         description: Notification created successfully
 */
router.post("/", isSystemAdmin, createNotification);

export default router;
