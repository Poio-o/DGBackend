# Changelog

## v0.3.0 - Modelado de Especies, Sistema de Evoluciones y Seed Masivo de Digimon

### Añadido
- Modelos relacionales en Prisma (`prisma/schema.prisma`) para `DigimonSpecies` y `EvolutionPath` con soporte para relaciones de evolución ramificadas.
- Dataset completo de 704 especies y 4.546 rutas de evolución en `prisma/digimons_data.json` con metadatos completos (nombres, niveles, atributos, tipos, sprites, imágenes oficiales y estadísticas base de HP, SP, ATK, DEF, INT, SPI, SPD).
- Script de sembrado masivo (`prisma/seed.ts`) con inserción por lotes (*batching*) mediante `createMany` e idempotencia con `skipDuplicates`.
- Script de ejecución de seed `"seed": "tsx prisma/seed.ts"` en `package.json`.
- Integración completa con el sistema de autenticación JWT y migraciones traídas de la rama `dev`.
- Escucha del servidor Express en `0.0.0.0` (`src/index.ts`) para aceptar conexiones tanto locales como de interfaces de red externas (dispositivos móviles / emuladores).

### Base de datos
- **Tabla `digimon_species`**:
  - Clave primaria `species_id` (`VARCHAR(50)`).
  - Metadatos: `name` (`VARCHAR(100)`), `generation` (`VARCHAR(50)`), `attribute` (`VARCHAR(50)` con soporte para atributos compuestos), `type` (`VARCHAR(100)`), `sprite_url` y `full_image_url`.
  - Estadísticas de combate: `base_hp`, `base_sp`, `base_atk`, `base_def`, `base_int`, `base_spi`, `base_spd`.
  - Campo de descripción de texto largo `description`.
- **Tabla `evolution_paths`**:
  - Identificador autoincremental `id`.
  - Claves foráneas `from_species_id` y `to_species_id` vinculadas a `digimon_species` con eliminación en cascada (`onDelete: Cascade`).
  - Requisitos de evolución: `min_level`, `min_friendship`, estadísticas mínimas (`min_hp`, `min_sp`, `min_atk`, etc.) e ítem requerido opcional (`required_item_id`).
  - Índices en `from_species_id` y `to_species_id` para optimizar consultas de árbol evolutivo.

### Scripts configurados
```bash
npm run seed  # Carga de especies y rutas de evolución en PostgreSQL
```

### Archivos creados
- `prisma/digimons_data.json` - Datos estructurados de 704 especies y 4.546 evoluciones
- `prisma/seed.ts` - Script de carga masiva de datos en PostgreSQL

### Archivos modificados
- `prisma/schema.prisma` - Incorporación de los modelos `DigimonSpecies` y `EvolutionPath` junto a `User` y `Credential`
- `package.json` - Añadido el script `seed`
- `src/index.ts` - Configurado `app.listen` con host `0.0.0.0`

---

## v0.2.3 - Middleware de Autenticación Bearer y Endpoint de Perfil [SUB-02-3]

### Añadido
- Middleware de autenticación `authMiddleware` (`src/middleware/authMiddleware.ts`) para intercepción y validación del header `Authorization: Bearer <token>`
- Decodificación y verificación criptográfica de tokens JWT mediante `jwt.verify`
- Manejo estricto de rechazo con código `401 Unauthorized` ante tokens ausentes, malformados o expirados
- Extensión del espacio de nombres de Express para tipado de `req.user` con la interfaz `JwtPayload`
- Método `getProfile` en `AuthService` para recuperar la información del usuario autenticado en base de datos
- Método `me` en `AuthController` para resolver la identidad del usuario actual
- Pruebas unitarias en `src/modules/auth/auth.test.ts` para verificar la protección del middleware (rechazo de peticiones sin cabecera, rechazo de tokens corruptos y paso exitoso con token firmado)

### Endpoints
- `GET /api/v1/auth/me` - Ruta protegida mediante `authMiddleware` que devuelve los datos del perfil activo

### Archivos creados
- `src/middleware/authMiddleware.ts` - Middleware de verificación y decodificación de tokens Bearer

### Archivos modificados
- `src/modules/auth/auth.service.ts` - Implementación del método `getProfile`
- `src/modules/auth/auth.controller.ts` - Implementación del método `me`
- `src/modules/auth/auth.routes.ts` - Registro de la ruta protegida `GET /me`
- `src/modules/auth/auth.test.ts` - Casos de prueba unitarios para el middleware de autenticación

---

## v0.2.2 - Endpoints y Servicios de Registro y Login con JWT [SUB-02-2]

### Añadido
- Módulo de autenticación en `src/modules/auth/` organizado en arquitectura por capas (rutas, controlador, servicio y DTOs)
- Servicio `AuthService` con métodos de registro (`register`) e inicio de sesión (`login`)
- Hashing unidireccional de contraseñas mediante `bcryptjs` con factor de coste de salt 10
- Creación atómica de usuario y credencial dentro de una transacción con `prisma.$transaction`
- Generación y firma de tokens JWT Bearer con tiempo de expiración extendido (30 días)
- Controlador `AuthController` con validaciones de campos obligatorios, formato de email y longitud mínima de credenciales
- Manejo de códigos HTTP semánticos (`201 Created` para registro, `200 OK` para login, `400 Bad Request`, `401 Unauthorized` y `409 Conflict`)
- Clase utilitaria `AppError` en `src/utils/errors.ts` para propagación estructurada de errores con código de estado HTTP
- Pruebas unitarias en `src/modules/auth/auth.test.ts` con el ejecutor nativo de Node.js y `tsx`
- Script `npm test` en `package.json` para ejecución automatizada de pruebas

### Endpoints
- `POST /api/v1/auth/register` - Registro de nuevos usuarios con email, nombre de usuario y contraseña
- `POST /api/v1/auth/login` - Inicio de sesión mediante identificador (correo o usuario) y contraseña

### Archivos creados
- `src/modules/auth/auth.types.ts` - DTOs e interfaces TypeScript para autenticación y payload JWT
- `src/modules/auth/auth.service.ts` - Lógica de negocio de registro, login, hashing y firma JWT
- `src/modules/auth/auth.controller.ts` - Controlador HTTP y validaciones de entrada
- `src/modules/auth/auth.routes.ts` - Definición de rutas públicas de autenticación
- `src/modules/auth/auth.test.ts` - Suite de pruebas unitarias de hashing y generación de token
- `src/utils/errors.ts` - Clase de error personalizada con soporte para códigos de estado HTTP

### Archivos modificados
- `src/app.ts` - Montaje del enrutador de autenticación bajo el prefijo de API
- `src/config/env.ts` - Tipado y exposición de variables de configuración para JWT
- `package.json` - Añadido script de test unitario

---

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
