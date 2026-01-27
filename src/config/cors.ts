import { CorsOptions } from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS
     ? process.env.ALLOWED_ORIGINS.split(',')
     : ['http://localhost:3000', 'http://localhost:5173']; // Common dev ports

export const corsOptions: CorsOptions = {
     origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);

          if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
               callback(null, true);
          } else {
               callback(new Error('Not allowed by CORS'));
          }
     },
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     credentials: true,
     optionsSuccessStatus: 200
};
