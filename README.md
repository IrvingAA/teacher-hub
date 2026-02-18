# Backend Assessment

Boilerplate para prueba técnica de reclutamiento backend con Node.js + TypeScript.

## Prerequisites

- Node.js >= 20
- Docker y Docker Compose

## Setup

1. Clona el repositorio:
```bash
git clone <repository-url>
cd backend-assessment
```

2. Copia el archivo de variables de entorno:
```bash
cp .env.example .env
```

3. Instala las dependencias:
```bash
npm install
```

4. Levanta los servicios con Docker:
```bash
docker compose up -d
```

5. Inicia el servidor en modo desarrollo:
```bash
npm run dev
```

## Verificación

Una vez que el servidor esté corriendo, verifica que todo funciona:

```bash
curl http://localhost:3000/health
```

Deberías recibir una respuesta similar a:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "postgres": "connected",
    "mongo": "connected",
    "redis": "connected"
  }
}
```

## Para el Candidato

Las carpetas `models/`, `services/` y `repositories/` están **vacías intencionalmente**. Durante la sesión en vivo de la prueba técnica, se te pedirá implementar la lógica de negocio en estas carpetas.

### Estructura del proyecto

```
src/
├── app.ts              # Configuración de Express
├── server.ts           # Punto de entrada del servidor
├── config/             # Configuración de bases de datos y variables de entorno
├── routes/             # Definición de rutas/endpoints
├── middlewares/        # Middlewares de Express
├── models/             # [VACÍO] Entidades TypeORM y esquemas Mongoose
├── services/           # [VACÍO] Lógica de negocio
├── repositories/       # [VACÍO] Acceso a datos
└── types/              # Definiciones de tipos TypeScript
```

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con hot-reload |
| `npm run build` | Compila el proyecto TypeScript |
| `npm start` | Ejecuta el servidor compilado (producción) |
| `npm test` | Ejecuta los tests |
| `npm run test:watch` | Ejecuta los tests en modo watch |
| `docker compose up -d` | Levanta PostgreSQL, MongoDB y Redis |
| `docker compose down` | Detiene los servicios de Docker |
| `docker compose logs -f` | Ver logs de los contenedores |

## Stack Tecnológico

- **Runtime**: Node.js >= 20
- **Lenguaje**: TypeScript (strict mode)
- **Framework**: Express.js
- **ORM SQL**: TypeORM (PostgreSQL)
- **ODM NoSQL**: Mongoose (MongoDB)
- **Cache**: ioredis (Redis)
- **Validación**: Zod
- **Testing**: Jest + Supertest
