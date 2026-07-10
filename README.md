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

- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado y en ejecución (para base de datos y backend)
- Node.js 20+ y npm instalados (para el servidor de desarrollo del frontend)

---

## Primera vez que se usa

Solo hace falta hacer esto una vez, al clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd smart-chef
docker-compose build backend
```

La primera vez que se arranque (siguiente sección), el propio backend se encarga de crear la base de datos, aplicar las migraciones y cargar el catálogo de 80 recetas de demostración — no hace falta ningún paso manual adicional.

---

## Arranque normal (cada vez que se trabaja en el proyecto)

**Terminal 1 — Base de datos y API:**

```bash
docker-compose up db backend
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install   # solo si es la primera vez, o si cambió package.json
npm run dev
```

### Acceder a la aplicación

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API REST | http://localhost:3000/api |
| Health check | http://localhost:3000/api/health |

### Credenciales de demostración

Estas cuentas existen únicamente para facilitar la evaluación del proyecto; no representan una configuración de seguridad real.

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@smartchef.com | Admin1234! | Administrador |
| usuario@smartchef.com | User1234! | Usuario estándar |

---

## Detener y volver a arrancar

Para una pausa normal (los datos se conservan):

```bash
docker-compose down
```

El siguiente `docker-compose up db backend` arranca de nuevo con todo tal como estaba.

Para borrar también la base de datos y empezar desde cero (equivalente a una "primera vez" otra vez, sin necesidad de reconstruir la imagen):

```bash
docker-compose down -v
```

---

## Cuándo reconstruir el contenedor del backend

Solo hace falta si cambia `backend/package.json` o `backend/Dockerfile` (por ejemplo, tras añadir una dependencia nueva):

```bash
docker-compose build backend
```

En el resto de casos, `docker-compose up db backend` es suficiente.

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
