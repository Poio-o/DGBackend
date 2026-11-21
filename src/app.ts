import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/error';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import digimonRoutes from './modules/digimon/digimon.routes';
import raisingRoutes from './modules/raising/raising.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';

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

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'DGBackend API funcionando correctamente en Vercel',
    version: '1.0.0',
    endpoints: {
      health: `${env.API_PREFIX}/health`,
      auth: `${env.API_PREFIX}/auth`,
      digimons: `${env.API_PREFIX}/digimons`,
      inventory: `${env.API_PREFIX}/inventory`,
    },
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(env.API_PREFIX, healthRoutes);
app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/digimons`, digimonRoutes);
app.use(`${env.API_PREFIX}/digimons`, raisingRoutes);
app.use(`${env.API_PREFIX}/inventory`, inventoryRoutes);

if (env.API_PREFIX !== '/api') {
  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/digimons', digimonRoutes);
  app.use('/api/digimons', raisingRoutes);
  app.use('/api/inventory', inventoryRoutes);
}

app.use('/digimons', digimonRoutes);
app.use('/digimons', raisingRoutes);
app.use('/inventory', inventoryRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
});

app.use(errorHandler);

export default app;
