import { ConnectionOptions } from "bullmq";

export const redisConfig: ConnectionOptions = {
     host: process.env.REDIS_HOST,
     port: Number(process.env.REDIS_PORT) || 6379,
     //password: process.env.REDIS_PASSWORD,
}