import { ConnectionOptions } from "bullmq";

export const redisConfig: ConnectionOptions = process.env.REDIS_URL
     ? {
          host: new URL(process.env.REDIS_URL).hostname,
          port: Number(new URL(process.env.REDIS_URL).port),
          //password: new URL(process.env.REDIS_URL).password,
          //username: new URL(process.env.REDIS_URL).username,
          tls: process.env.REDIS_URL.includes("rediss://") ? {} : undefined
     }
     : {
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          //password: process.env.REDIS_PASSWORD,
     };