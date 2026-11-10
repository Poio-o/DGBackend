import app from './app';
import { env } from './config/env';
import { testDbConnection } from './config/db';
import { logger } from './utils/logger';

const startServer = async () => {
  logger.info('Iniciando DGBackend Server...');

  await testDbConnection();

  const server = app.listen(env.PORT, () => {
    logger.info(`API escuchando en http://localhost:${env.PORT}`);
    logger.info(`Entorno: ${env.NODE_ENV}`);
    logger.info(`Health check activo en http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  });

  const shutdown = () => {
    logger.info('Señal recibida, cerrando servidor...');
    server.close(() => {
      logger.info('Servidor cerrado correctamente');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((error) => {
  logger.error(`Error al arrancar el servidor: ${error.message}`);
  process.exit(1);
});
