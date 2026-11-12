# Mini CMDB – application

A small Configuration Management Database for tracking servers/VMs across AWS and Azure.
Spring Boot REST API + React SPA + PostgreSQL, packaged as two container images.

## Architecture

```
 Browser ──► Frontend (NGINX :80) ──/api/*──► Backend (Spring Boot :8080) ──► PostgreSQL :5432
              serves the React SPA            REST API, validation, JPA          not exposed
```

- **Frontend** (`app/frontend`) – static React build served by NGINX. NGINX also reverse-proxies `/api/*` to the backend,
  so the browser talks to a single origin (no CORS, no hardcoded backend URL). The backend target is set at container
  start with `BACKEND_URL`.
- **Backend** (`app/backend`) – layered Spring Boot app: `controller → service → repository → entity`, DTO records for
  the API, `ServerMapper`, and a `@RestControllerAdvice` for uniform errors. Schema is owned by Flyway
  (`db/migration`); Hibernate only validates it. Filtering uses JPA `Specification`s, dashboard statistics use
  `GROUP BY` queries (no full table loads).
- **Database** – PostgreSQL. Connection settings come exclusively from environment variables.
- No authentication in the MVP; access control is expected to be handled by the platform (Kubernetes RBAC, network policies).

### Technology stack

| Layer    | Technology |
|----------|------------|
| Backend  | Java 21, Spring Boot 3.5, Spring Web, Spring Data JPA/Hibernate, Bean Validation, Actuator, Flyway, springdoc-openapi |
| Database | PostgreSQL 17 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, Recharts, Lucide icons |
| Tests    | JUnit 5, Mockito, Spring Boot Test (H2 in PostgreSQL mode), Vitest + Testing Library |

### Directory layout

```
app/
├── docker-compose.yml        local stack (postgres + backend + frontend)
├── .env.example              copy to .env
├── backend/
│   ├── Dockerfile, pom.xml
│   └── src/main/java/com/devopslab/cmdb/
│       ├── controller/       ServerController (thin, HTTP only)
│       ├── service/          ServerService (business rules, stats)
│       ├── repository/       ServerRepository, ServerSpecifications
│       ├── entity/           Server + enums
│       ├── dto/              request/response records
│       ├── mapper/           ServerMapper
│       ├── exception/        GlobalExceptionHandler, ApiError, domain exceptions
│       └── config/           CorsConfig, DataSeeder
└── frontend/
    ├── Dockerfile, nginx/default.conf.template
    └── src/
        ├── api/              axios client + server API functions
        ├── components/       layout/, ui/, servers/ (form)
        ├── hooks/, lib/, types/
        └── pages/            Dashboard, Servers, ServerDetail, ServerForm, Settings
```

## Environment variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `cmdb` | Database name |
| `DB_USER` | `cmdb` | Database user |
| `DB_PASSWORD` | **required** | Database password (no default; inject via Secret) |
| `DB_POOL_SIZE` | `10` | Hikari max pool size |
| `SERVER_PORT` | `8080` | HTTP port |
| `APP_SEED_ENABLED` | `false` | Insert sample servers when the table is empty (dev only) |
| `CORS_ALLOWED_ORIGINS` | empty | Comma-separated origins; only needed if the SPA is served from another origin |
| `JAVA_OPTS` | container-aware defaults | JVM flags (container image) |

### Frontend

| Variable | When | Description |
|----------|------|-------------|
| `VITE_API_BASE_URL` | build time | API base URL, default `/api/v1` (same origin, proxied) |
| `VITE_DEV_PROXY_TARGET` | `npm run dev` | Vite proxy target for `/api`, default `http://localhost:8080` |
| `BACKEND_URL` | container start | NGINX upstream for `/api/`, default `http://backend:8080` |

### Compose (`.env`)

`DB_NAME`, `DB_USER`, `DB_PASSWORD` (required), `APP_SEED_ENABLED`, `FRONTEND_PORT` (8082), `BACKEND_PORT` (8081).

## Quick start with Docker Compose

```bash
cd app
cp .env.example .env          # set DB_PASSWORD
docker compose up --build -d
open http://localhost:8082    # UI
open http://localhost:8081/swagger-ui.html   # API docs
docker compose down           # add -v to also delete the database volume
```

PostgreSQL is not published to the host; only the backend can reach it. Data survives restarts in the `postgres-data` volume.

## Local development (without Docker for the apps)

**PostgreSQL**

```bash
docker run -d --name cmdb-pg -e POSTGRES_DB=cmdb -e POSTGRES_USER=cmdb -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 postgres:17
```

**Backend** (http://localhost:8080)

```bash
cd app/backend
DB_PASSWORD=dev APP_SEED_ENABLED=true mvn spring-boot:run
```

**Frontend** (http://localhost:5173, proxies `/api` to the backend)

```bash
cd app/frontend
npm install
npm run dev
```

## API

Base path `/api/v1/servers`. Interactive docs: `/swagger-ui.html`, spec: `/api-docs`.

| Method | Endpoint | Description | Success |
|--------|----------|-------------|---------|
| GET | `/api/v1/servers` | List with search, filters, sorting, pagination | 200 |
| GET | `/api/v1/servers/{id}` | Server details | 200 / 404 |
| POST | `/api/v1/servers` | Create | 201 (+`Location`) / 400 / 409 |
| PUT | `/api/v1/servers/{id}` | Replace/update | 200 / 400 / 404 / 409 |
| DELETE | `/api/v1/servers/{id}` | Delete | 204 / 404 |
| GET | `/api/v1/servers/stats` | Dashboard aggregates | 200 |
| GET | `/api/v1/servers/filters` | Enum values for dropdowns | 200 |

List query parameters: `search` (hostname or IP, case-insensitive substring), `operatingSystem`, `environment`,
`location`, `purpose`, `status`, `page` (0-based), `size` (default 20, max 100), `sort=field,asc|desc`
(allowed: hostname, ipAddress, operatingSystem, environment, location, purpose, cpuCores, memoryGb, diskGb, status, createdAt, updatedAt).

```bash
curl 'http://localhost:8081/api/v1/servers?environment=PROD&search=jenkins&sort=hostname,asc&size=10'
curl -X POST http://localhost:8081/api/v1/servers -H 'Content-Type: application/json' -d '{
  "hostname":"web-01","ipAddress":"10.0.0.5","operatingSystem":"UBUNTU","osVersion":"22.04",
  "environment":"DEV","location":"AWS","purpose":"WORKER","status":"ACTIVE","cpuCores":4,"memoryGb":16,"diskGb":100}'
```

Errors share one shape:

```json
{ "timestamp": "…", "status": 400, "error": "Bad Request", "message": "Validation failed",
  "path": "/api/v1/servers", "fieldErrors": { "hostname": "Hostname is required" } }
```

Hostnames are unique case-insensitively (409 on conflict). Required: hostname, operatingSystem, environment, location,
purpose, status. Everything else is optional; CPU/memory/disk must be ≥ 0; `ipAddress` must be IPv4/IPv6 when provided.

### Health endpoints (Kubernetes probes)

Only `health` is exposed by Actuator:

- `/actuator/health` – overall
- `/actuator/health/liveness` – liveness probe
- `/actuator/health/readiness` – readiness probe (includes DB connectivity)

The frontend container exposes `/healthz`.

## Tests

```bash
cd app/backend  && mvn test       # unit tests (Mockito) + integration tests (MockMvc + H2)
cd app/frontend && npm test       # Vitest
cd app/frontend && npm run build  # type-check + production build
```

## Building images

```bash
cd app
docker build -t cmdb-backend:local  backend
docker build -t cmdb-frontend:local frontend

# Multi-arch / amd64 for deployment from an Apple Silicon machine
docker buildx build --platform linux/amd64 -t ghcr.io/<user>/cmdb-backend:<tag>  backend
docker buildx build --platform linux/amd64 -t ghcr.io/<user>/cmdb-frontend:<tag> frontend
```

Both Dockerfiles use only multi-arch base images (`eclipse-temurin`, `maven`, `node`, `nginx`), so ARM64 and AMD64 builds work.

Kubernetes notes: the backend image runs as UID 10001; set `DB_*` from a Secret/ConfigMap and point the frontend
`BACKEND_URL` at the backend Service (e.g. `http://backend:8080`). The frontend image runs NGINX on port 80 (master
process as root, workers as `nginx`); to run it fully non-root, switch to `nginxinc/nginx-unprivileged` and port 8080.
