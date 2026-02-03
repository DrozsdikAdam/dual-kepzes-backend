import { Queue } from "bullmq";
import { redisConfig, isRedisEnabled } from "../config/redis";

export const emailQueue = isRedisEnabled
     ? new Queue("email-queue", { connection: redisConfig })
     : null;

export const addEmailToQueue = async (data: {
     notificationId: string;
     email: string;
     subject: string;
     body: string;
}) => {
     if (!isRedisEnabled || !emailQueue) {
          console.warn(`[Queue Disabled] Skipping background job for email to: ${data.email}. Install Redis to enable background processing.`);
          return;
     }

     await emailQueue.add("send-email", data, {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 }
     })
}