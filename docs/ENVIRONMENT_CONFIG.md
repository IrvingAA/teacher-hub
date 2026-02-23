# 🔐 Configuración de Entorno: TeacherHub Api

Este documento detalla la jerarquía de variables y secretos necesarios para integrar este servicio con el ecosistema de **astrohub-infra**.

---

## 🏗️ 1. GitHub Environments (Capa Infra)

Para que el despliegue funcione, debes configurar un **GitHub Environment** en este repositorio (Settings > Environments). El nombre debe seguir el patrón: `teacherhub-api-<env>` (ej. `teacherhub-api-dev`).

### Variables (`Vars`)
| Variable | Valor Sugerido | Descripción |
| :--- | :--- | :--- |
| `SERVICE_DOMAIN` | `api-teacherhub.iayala.dev` | Dominio para el reverse proxy de Nginx. |
| `LETSENCRYPT_EMAIL` | `ops@iayala.dev` | Email para la generación de certificados SSL. |
| `ALLOWED_SOURCE_REPO` | `IrvingAA/backend-technical-test` | Validación de seguridad en el orquestador. |
| `GHCR_IMAGES` | `teacherhub-api` | Nombre de la imagen que se subirá a GHCR. |
| `DOPPLER_PROJECT` | `teacherhub-api` | Proyecto correspondiente en Doppler. |
| `DOPPLER_CONFIG` | `dev` | Configuración (branch) de Doppler. |
| `SERVICE_HEALTH_PATH` | `/health` | Endpoint que Ansible usará para validar el deploy. |
| `SERVICE_CONTAINER_PORT` | `3000` | Puerto en el que corre la App dentro de Docker. |

### Secretos (`Secrets`)
| Secreto | Descripción |
| :--- | :--- |
| `DOPPLER_TOKEN_SERVICE` | Token de Doppler con acceso de lectura a la config. |
| `GHCR_USER` | Tu usuario de GitHub. |
| `GHCR_TOKEN` | Personal Access Token (PAT) con permisos de paquetes. |
| `SSH_HOST` | IP del servidor de destino. |
| `SSH_USER` | Usuario SSH (ej: `ubuntu`). |
| `SSH_PRIVATE_KEY` | Contenido de la llave privada `.pem`. |

---

## ☁️ 2. Doppler (Capa Aplicación / Negocio)

Estas variables deben gestionarse exclusivamente en Doppler para evitar que se filtren en el CI/CD o en el código.

### Base de Datos (TypeORM)
| Key | Valor en Producción/Docker |
| :--- | :--- |
| `DB_HOST` | `db` (nombre del servicio en compose.production.yml) |
| `DB_PORT` | `5432` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `<secret>` |
| `DB_NAME` | `teacherhub` |
| `DB_SYNCHRONIZE` | `false` |
| `DB_RUN_MIGRATIONS` | `true` |

### Seguridad
| Key | Descripción |
| :--- | :--- |
| `JWT_SECRET` | Llave para firmar tokens de acceso. |
| `JWT_ISSUER` | Emisor del token (ej. `backend.teacherhub`). |
| `API_KEY_BOOTSTRAP_VALUE` | Valor inicial de la API Key (Formato: `thk_publicKey.secret`). Ej: `thk_bootstrap.secretkey123456789` |
| `API_KEY_ENABLED` | `true` |

### Infraestructura App
| Key | Valor |
| :--- | :--- |
| `PORT` | `3000` |
| `REDIS_HOST` | `redis` |
| `REDIS_PORT` | `6379` |
| `CORS_ORIGIN` | `https://tu-frontend.com` |

---

## 🔄 3. Funcionamiento del Pipeline

1. **Build & Test**: El workflow de GitHub (`ci.yml`) corre tests y construye la imagen `runner`.
2. **Push**: Sube la imagen a `ghcr.io/usuario/teacherhub-api:SHA`.
3. **Dispatch**: Envía un evento `deploy-request` al repositorio `astrohub-infra`.
4. **Ansible**: El orquestador recibe el evento, lee las variables de GitHub Environment, descarga el `.env` final desde Doppler y reinicia los contenedores en el servidor.
