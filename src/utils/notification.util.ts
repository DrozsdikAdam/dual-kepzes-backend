import { Role } from '@prisma/client';
import { userService } from '../services/user.service';
import { notificationService } from '../services/notification.service';

/**
 * Notifies all system administrators with a given title, message, and type.
 * Useful for drying up controller logic that needs to alert admins about system-wide events.
 */
export async function notifySystemAdmins(params: {
     title: string;
     message: string;
     type: string;
}) {
     const { title, message, type } = params;
     const result = await userService.getAllByRole(Role.SYSTEM_ADMIN);

     // Handle both array and paginated result
     const admins = Array.isArray(result) ? result : result.data;

     const notifications = admins.map((admin: any) =>
          notificationService.create({
               userId: admin.id,
               title,
               message,
               type
          })
     );

     await Promise.all(notifications);
}
