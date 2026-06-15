import { Queue } from "bullmq";
import { redisConfig, isRedisEnabled } from "../config/redis";
import { mailer, mailFrom } from "../config/mailer";
import prisma from "../config/prisma";

export const emailQueue = isRedisEnabled
     ? new Queue("email-queue", { connection: redisConfig })
     : null;

export const sendEmailDirectly = async (data: {
     notificationId?: string;
     email: string;
     subject: string;
     body: string;
}) => {
     const { notificationId, email, subject, body } = data;
     try {
          if (notificationId) {
               const notification = await prisma.notification.findUnique({
                    where: { id: notificationId },
                    include: { user: true }
               });

               if (notification && !["EMAIL_VERIFICATION", "PASSWORD_RESET"].includes(notification.type) && !notification.user.isEmailEnabled) {
                    console.log(`[Email Direct/Fallback] Skipping email to ${email} as user has disabled emails and it's not a critical type.`);
                    await prisma.notification.update({
                         where: { id: notificationId },
                         data: {
                              status: "SENT", // Marking as sent to avoid retries, but noting it was skipped
                              sentAt: new Date(),
                              error: "Cancelled: User has emails disabled.",
                         }
                    });
                    return;
               }
          }

          const isHtml = body.trim().startsWith("<");
          await mailer.sendMail({
               from: mailFrom,
               to: email,
               subject: subject,
               ...(isHtml ? { html: body } : { text: body })
          });

          if (notificationId) {
               await prisma.notification.update({
                    where: { id: notificationId },
                    data: {
                         status: "SENT",
                         sentAt: new Date(),
                         error: null,
                      }
                 });
            }
     } catch (error: any) {
          console.error(`[Email Direct/Fallback Error] Failed to send email to ${email}:`, error);
          if (notificationId) {
               await prisma.notification.update({
                    where: { id: notificationId },
                    data: {
                         status: "FAILED",
                         error: error.message,
                         sentAt: new Date(),
                    }
               });
          }
          throw error;
     }
};

export const addEmailToQueue = async (data: {
     notificationId?: string;
     email: string;
     subject: string;
     body: string;
}) => {
     if (!isRedisEnabled || !emailQueue) {
          console.warn(`[Queue Disabled] Redis is disabled. Sending email directly to: ${data.email}`);
          // Send asynchronously so it doesn't block the HTTP request execution flow
          sendEmailDirectly(data).catch(error => {
               console.error(`[Email Direct/Fallback Queue Error] Failed to send email directly to ${data.email}:`, error);
          });
          return;
     }

     await emailQueue.add("send-email", data, {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 }
     });
};