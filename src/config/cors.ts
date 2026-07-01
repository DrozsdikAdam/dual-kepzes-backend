import { CorsOptions } from 'cors';

const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
     ? process.env.ALLOWED_ORIGINS.split(',')
     : [];

export const corsOptions: CorsOptions = {
     origin: (origin, callback) => {
          // HA az origin benne van a listában, VAGY ha az origin nem létezik (undefined), akkor mehet!
          if (!origin || allowedOrigins.includes(origin)) {
               callback(null, true);
          } else {
               callback(new Error(`Not allowed by CORS. Allowed: ${allowedOrigins.join(', ')}`));
          }
     },
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};