import { Worker } from "bullmq";
import { redisConfig, isRedisEnabled } from "../config/redis";
import { sendEmailDirectly } from "./email.queue";

export const emailWorker = isRedisEnabled
     ? new Worker("email-queue", async (job) => {
          await sendEmailDirectly(job.data);
     },
          { connection: redisConfig }
     )
     : null;
