import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';

const app: Application = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Test Route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Duális Képzés Backend API',
        status: 'Running',
        timestamp: new Date()
    });
});

export default app;