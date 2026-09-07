import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.frontendOrigin, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '10kb' }));
app.use(rateLimit({ windowMs: config.rateLimitWindowMs, limit: config.rateLimitMax, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/health', (_request, response) => response.json({ status: true, statusCode: 200, message: 'API is healthy', data: null }));
app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
