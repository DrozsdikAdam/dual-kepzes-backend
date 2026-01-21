import { Queue } from "bullmq";
import { redisConfig } from "../config/redis";

export const emailQueue = new Queue("email-queue", { connection: redisConfig });

export const addEmailToQueue = async (data: {
     notificationId: string;
     email: string;
     subject: string;
     body: string;
}) => {
     await emailQueue.add("send-email", data, {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 }
     })
}