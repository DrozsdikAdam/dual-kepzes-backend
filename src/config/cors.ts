import { CorsOptions } from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS
     ? process.env.ALLOWED_ORIGINS.split(',')
     : [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://dual-kepzes-frontend.vercel.app'
     ]; // Common dev ports + production frontend

export const corsOptions: CorsOptions = {
     origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);

          if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
               callback(null, true);
          } else {
               // Log the rejected origin to help debugging in production
               console.error(`CORS rejected origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
               callback(new Error('Not allowed by CORS'));
          }
     },
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     credentials: true,
     optionsSuccessStatus: 200
};
