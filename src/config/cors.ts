import { CorsOptions } from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS
     ? process.env.ALLOWED_ORIGINS.split(',')
     : [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:8080',
          'https://dual-kepzes-frontend.vercel.app',
          'https://dual-kepzes-backend-production-7c45.up.railway.app'
     ]; // Common dev ports + production frontend

export const corsOptions: CorsOptions = {
     origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);

          // Check if origin matches allowed list or Vercel preview patterns
          const isAllowed = allowedOrigins.includes(origin);
          const isVercelPreview = origin.startsWith('https://dual-kepzes-frontend') && origin.endsWith('.vercel.app');

          if (isAllowed || isVercelPreview || process.env.NODE_ENV !== 'production') {
               callback(null, true);
          } else {
               // Log the rejected origin to help debugging in production
               console.error(`CORS rejected origin: ${origin}. Allowed: ${allowedOrigins.join(', ')} or *.vercel.app previews`);
               callback(new Error('Not allowed by CORS'));
          }
     },
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
     credentials: true,
     optionsSuccessStatus: 200
};
/* ez van a serverszinten
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
*/