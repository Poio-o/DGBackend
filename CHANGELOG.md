# Changelog

## v0.2.1 - Modelo de Datos de Autenticación, Migración de Usuarios y Credenciales [SUB-02-1]

### Añadido
- Modelado relacional en Prisma (`prisma/schema.prisma`) para las entidades `User` y `Credential`
- Relación 1 a N entre usuarios y múltiples credenciales con eliminación en cascada (`onDelete: Cascade`)
- Restricciones de unicidad en base de datos para `users.email`, `users.username` y la tupla compuesta `credentials(user_id, provider)`
- Mapeo declarativo de modelos a tablas (`users`, `credentials`) y columnas a convención PostgreSQL snake_case (`created_at`, `updated_at`, `user_id`)
- Script de migración SQL inicial (`prisma/migrations/20261110182000_init_users/migration.sql`) con DDL para PostgreSQL
- Configuración de variables de entorno para autenticación (`JWT_SECRET` y `JWT_EXPIRES_IN=30d`) en `.env` y `.env.example`
- Instalación de librerías para hashing seguro y tokens: `bcryptjs` y `jsonwebtoken`
- Tipado estricto para dependencias criptográficas con `@types/bcryptjs` y `@types/jsonwebtoken`
- Generación del cliente tipado de Prisma (`@prisma/client`) con soporte para consultas sobre `prisma.user` y `prisma.credential`

### Base de datos y persistencia
- **Tablas creadas en la migración inicial**:
  - `users`: Identificador único (CUID), email único, username único, marcas de tiempo de creación (`created_at`) y actualización (`updated_at`)
  - `credentials`: Identificador único (CUID), referencia al usuario (`user_id`), tipo de proveedor (`provider`), hash secreto (`secret`), marcas de tiempo
- **Integridad referencial y restricciones**:
  - Clave foránea `credentials_user_id_fkey` con `ON DELETE CASCADE` y `ON UPDATE CASCADE`
  - Índices únicos `users_email_key`, `users_username_key` y `credentials_user_id_provider_key`

### Archivos creados
- `prisma/migrations/20261110182000_init_users/migration.sql` - Script SQL DDL de la migración inicial
- `.env` - Configuración de variables de entorno locales (puerto, base de datos y JWT)

### Archivos modificados
- `prisma/schema.prisma` - Definición declarativa de los modelos `User` y `Credential`
- `.env.example` - Plantilla con las nuevas variables de entorno para JWT
- `package.json` - Inclusión de `bcryptjs`, `jsonwebtoken` y tipos de desarrollo

### Dependencias añadidas
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.8"
  }
}
```

---

## v0.2.0 - Express básico, PostgreSQL con Docker, Prisma ORM y Winston

### Añadido
- Servidor Express configurado con `helmet` y `cors`
- Contenedor PostgreSQL 16 en `docker-compose.yml` con healthcheck
- Prisma ORM configurado con datasource PostgreSQL
- Cliente Prisma en `src/config/db.ts` con función de verificación de conexión
- Logger Winston con niveles personalizados (error, warn, info, http, debug) y colores
- Persistencia de logs en archivos (`logs/all.log` y `logs/error.log`)
- Middleware de logging de peticiones HTTP (`src/middleware/requestLogger.ts`)
- Manejo centralizado de errores (`src/middleware/error.ts`) y captura de rutas 404
- Módulo `health` (`src/modules/health/`) con consulta activa a base de datos y medición de latencia
- Endpoint rápido `/health` y endpoint completo `/api/v1/health`
- Gestión de variables de entorno con `dotenv` en `src/config/env.ts`
- Cierre limpio del servidor (*graceful shutdown*) ante señales `SIGTERM` y `SIGINT`

### Endpoints
- `GET /health` - Comprobación rápida de disponibilidad (`{ ok: true }`)
- `GET /api/v1/health` - Comprobación detallada con estado de PostgreSQL, versión, uptime y latencia

### Base de datos
- **Servicio PostgreSQL 16 en Docker Compose**
- Healthcheck activo (`pg_isready -U postgres`)
- Volumen persistente `postgres_data`
- Configuración de Prisma schema con provider `postgresql`

### Logging y monitoreo
- **Winston Logger**:
  - Niveles: `error`, `warn`, `info`, `http`, `debug`
  - Transports: Consola coloreada, `logs/all.log` y `logs/error.log`
  - Formato: timestamp (`YYYY-MM-DD HH:mm:ss`) + nivel + mensaje
- Registro automático de peticiones HTTP con método, ruta, status code y tiempo de respuesta en ms

### Archivos creados
- `src/index.ts` - Punto de entrada del servidor y graceful shutdown
- `src/app.ts` - Configuración de Express, middlewares y rutas
- `src/config/env.ts` - Carga y tipado de variables de entorno
- `src/config/db.ts` - Instancia de Prisma Client y comprobación de conexión
- `src/utils/logger.ts` - Configuración del logger Winston
- `src/middleware/requestLogger.ts` - Middleware de log de peticiones
- `src/middleware/error.ts` - Middleware de manejo global de errores
- `src/modules/health/health.controller.ts` - Controlador del healthcheck
- `src/modules/health/health.routes.ts` - Rutas del módulo health
- `src/modules/health/health.service.ts` - Servicio con consulta SQL a PostgreSQL mediante Prisma
- `docker-compose.yml` - Orquestación del servicio PostgreSQL
- `.env.example` - Plantilla de variables de entorno

### Dependencias instaladas
```json
{
  "dependencies": {
    "@prisma/client": "^6.4.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "winston": "^3.17.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.14",
    "prisma": "^6.4.0",
    "tsx": "^4.23.15"
  }
}
```

---

## v0.1.0 - Proyecto base

### Añadido
- Inicialización del proyecto npm (`package.json`)
- Configuración estricta de TypeScript (`tsconfig.json`)
- Configuración de nodemon con ejecutor `tsx` (`nodemon.json`)
- Estructura de carpetas modular (`src/config`, `src/middleware`, `src/modules`, `src/utils`)
- Scripts de desarrollo (`npm run dev`), compilación (`npm run build`) y producción (`npm start`)
- Archivo `.gitignore` configurado para ignorar `node_modules/`, `dist/`, `logs/` y `.env`

### Scripts configurados
```bash
npm run dev   # Ejecución en desarrollo con nodemon y tsx
npm run build # Compilación de TypeScript con tsc
npm start     # Arranque de la versión compilada en dist/index.js
```

### Archivos creados
- `package.json` - Definición del paquete y scripts
- `tsconfig.json` - Configuración del compilador TypeScript
- `nodemon.json` - Configuración de recarga en desarrollo con tsx
- `.gitignore` - Reglas de exclusión de Git
