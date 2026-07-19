# Smart Chef

Aplicación web de recomendación culinaria basada en reglas y metadatos.  
Trabajo de Fin de Grado — Ingeniería Informática · Universidad Internacional de La Rioja (UNIR).

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js 20 + Express + TypeScript + Prisma ORM |
| Base de datos | PostgreSQL 17 |
| Frontend | Vue 3 + TypeScript + Vuetify 3 + Vite |
| Infraestructura | Docker + Docker Compose |

---

## Requisitos previos

- Tener instalado y corriendo [Docker Desktop](https://www.docker.com/products/docker-desktop) (para base de datos y backend)
- Tener instalado Node.js 20+ y npm (para el servidor de desarrollo del frontend)

---

## Puesta en marcha

### Primera vez

```bash
git clone <url-del-repositorio>
cd smart-chef
docker-compose build backend
```

### Arrancar para desarrollar

**Terminal 1 — Base de datos y API:**
```bash
docker-compose up db backend
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install   # solo la primera vez
npm run dev
```

### Acceder a la aplicación

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API REST | http://localhost:3000/api |
| Health check | http://localhost:3000/api/health |

> **Desde otro dispositivo (móvil, tablet, otro ordenador) conectado a la misma red WiFi:** abre `http://<IP-DEL-PC>:5173`. La IP la muestra el propio Vite al arrancar el frontend (es la que empieza por `192.168.`).

### Credenciales de demostración

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@smartchef.com | Admin1234! | Administrador |
| usuario@smartchef.com | User1234! | Usuario estándar |

---

## Variables de entorno

Ninguna variable es obligatoria para arrancar: todas tienen un valor por
defecto, ya sea en el propio `.env.example` o en `docker-compose.yml`.

**`backend/.env.example`:**

| Variable | Por defecto | Uso |
|----------|-------------|-----|
| `DATABASE_URL` | `postgresql://smart_chef_user:smart_chef_pass@localhost:5432/smart_chef_db` | Conexión Prisma a PostgreSQL |
| `JWT_SECRET` | `cambia_este_secreto_por_uno_seguro_en_produccion` | Firma de los tokens JWT |
| `JWT_EXPIRES_IN` | `15m` | Duración del token de acceso |
| `PORT` | `3000` | Puerto del servidor Express |
| `NODE_ENV` | `development` | Entorno de ejecución |
| `CORS_ORIGIN` | `http://localhost:5173` | Whitelist de orígenes CORS (admite lista separada por comas) |

**`frontend/.env.example`:**

| Variable | Por defecto | Uso |
|----------|-------------|-----|
| `VITE_API_URL` | vacío | URL base de la API. Vacío = peticiones relativas a `/api` vía proxy de Vite. No hace falta tocarla para el uso normal en localhost. |

**Nota de seguridad:** `JWT_SECRET` tiene un valor por defecto que está publicado en este repositorio. Si vas a usar esta app fuera de tu demo local (cualquier despliegue accesible por terceros), cámbialo por un secreto propio.

---

## Cuándo reconstruir el contenedor del backend

Solo es necesario reconstruir cuando cambien `backend/package.json` o `backend/Dockerfile`:

```bash
docker-compose build backend
```

---

## Detener los servicios

```bash
docker-compose down          # detiene y conserva los datos
docker-compose down -v       # detiene y borra la base de datos
```

---

## Estructura del proyecto

```
smart-chef/
├── backend/                    # API REST (Express + TypeScript)
│   ├── Dockerfile
│   ├── entrypoint.sh           # Migraciones + seed + servidor
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts             # 80 recetas de demostración
│   │   └── migrations/
│   └── src/
│       ├── app.ts
│       └── index.ts
├── frontend/                   # SPA (Vue 3 + Vuetify 3)
│   └── src/
│       ├── App.vue
│       └── main.ts
├── docker-compose.yml
└── README.md
```
