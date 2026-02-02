import { ConnectionOptions } from "bullmq";

const getRedisConfig = (): { config: ConnectionOptions; enabled: boolean } => {
     const url = process.env.REDIS_URL;
     const isProd = process.env.NODE_ENV === 'production';
     const isExplicitlyDisabled = process.env.REDIS_ENABLED === 'false';

     // Only enable if we have a connection source THAT IS NOT localhost 
     // (unless we are in development and explicitly want it)
     const hasConfig = !!process.env.REDIS_URL || (!!process.env.REDIS_HOST && process.env.REDIS_HOST !== '127.0.0.1');
     const shouldEnable = !isExplicitlyDisabled && (hasConfig || (process.env.NODE_ENV !== 'production' && !!process.env.REDIS_HOST));

     if (!hasConfig && isProd && !isExplicitlyDisabled) {
          console.warn("⚠️ [PRODUCTION] Redis is not configured. Background jobs (email) will be disabled.");
     }

     if (url) {
          try {
               const parsed = new URL(url);
               return {
                    enabled: true,
                    config: {
                         host: parsed.hostname,
                         port: Number(parsed.port),
                         password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
                         username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
                         tls: url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
                         maxRetriesPerRequest: null,
                    }
               };
          } catch (e) {
               console.error("Failed to parse REDIS_URL, falling back to components:", e);
          }
     }

     return {
          enabled: shouldEnable,
          config: {
               host: process.env.REDIS_HOST || '127.0.0.1',
               port: Number(process.env.REDIS_PORT) || 6379,
               password: process.env.REDIS_PASSWORD,
               username: process.env.REDIS_USERNAME,
               maxRetriesPerRequest: null,
          }
     };
};

const result = getRedisConfig();
export const redisConfig = result.config;
export const isRedisEnabled = result.enabled;