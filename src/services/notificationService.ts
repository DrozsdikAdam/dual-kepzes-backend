import prisma from "../config/prisma";

export const createNotification = async (
     userId: string,
     title: string,
     message: string,
     type: string
) => {
     try {
          return await prisma.notification.create({
               data: {
                    userId,
                    title,
                    message,
                    type,
               },
          });
     } catch (error) {
          console.error("Error creating notification:", error);
          throw new Error("Could not create notification");
     }
};
