import { Worker } from "bullmq"
import { redisConfig, isRedisEnabled } from "../config/redis"
import { mailer } from "../config/mailer"
import prisma from "../config/prisma"

export const emailWorker = isRedisEnabled
     ? new Worker("email-queue", async (job) => {
          const { notificationId, email, subject, body } = job.data
          try {
               // Fail-safe: check if user still has emails enabled or if it's a critical type
               const notification = await prisma.notification.findUnique({
                    where: { id: notificationId },
                    include: { user: true }
               });

               if (notification && !["EMAIL_VERIFICATION", "PASSWORD_RESET"].includes(notification.type) && !notification.user.isEmailEnabled) {
                    console.log(`[Email Worker] Skipping email to ${email} as user has disabled emails and it's not a critical type.`);
                    await prisma.notification.update({
                         where: { id: notificationId },
                         data: {
                              status: "SENT", // Maring as sent to avoid retries, but noting it was skipped
                              sentAt: new Date(),
                              error: "Cancelled: User has emails disabled.",
                         }
                    });
                    return;
               }

               await mailer.sendMail({
                    from: '"Duális Képzés" <no-reply@dualis.hu>',
                    to: email,
                    subject: subject,
                    text: body
               })

               await prisma.notification.update({
                    where: { id: notificationId },
                    data: {
                         status: "SENT",
                         sentAt: new Date(),
                         error: null,
                    }
               })

          } catch (error: any) {
               await prisma.notification.update({
                    where: { id: notificationId },
                    data: {
                         status: "FAILED",
                         error: error.message,
                         sentAt: new Date(),
                    }
               })
               throw error;
          }
     },
          { connection: redisConfig }
     )
     : null;
