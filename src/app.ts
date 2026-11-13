import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/error';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(env.API_PREFIX, healthRoutes);
app.use(`${env.API_PREFIX}/auth`, authRoutes);
if (env.API_PREFIX !== '/api') {
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
}

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
});

app.use(errorHandler);

export default app;
