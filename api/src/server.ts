import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import healthRouter from './routes/health';
import certificatesRouter from './routes/certificates';
import { errorHandler, notFound } from './middleware/errorHandler';
import config from './config';

dotenv.config();

const app = express();
const { port, corsOrigin } = config.server;

app.use(helmet());
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api', healthRouter);
app.use('/api/certificates', certificatesRouter);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/api/health`);
  console.log(`📜 Certificates: http://localhost:${port}/api/certificates`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
});

process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('💀 Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('💀 Process terminated');
    process.exit(0);
  });
});

export default app;