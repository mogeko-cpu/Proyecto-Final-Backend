# Proyecto Final Backend — P3: Monitoreo y alertas de conservación (CLENA)

Sistema para el Archivo Histórico del CLENA que reemplaza la evaluación manual y esporádica del estado de los documentos por un registro con historial, monitoreo ambiental y alertas tempranas.

- **Proyecto:** P3 — Monitoreo y alertas de conservación
- **Equipo de origen (cliente):** G7
- **Curso:** Backend — Universidad del Norte, 2026
- **Tablero Scrum:** [GitHub Project](https://github.com/users/mogeko-cpu/projects/1)
- **Backlog:** [Issues](https://github.com/mogeko-cpu/Proyecto-Final-Backend/issues)

## Cómo ejecutarlo

Requisitos: Docker Desktop. Para desarrollo sin Docker: Node.js 22 o superior y PostgreSQL.

```bash
docker compose up -d --build
```

- Aplicación: http://localhost:8080
- API: http://localhost:3000/api/v1
- Salud: http://localhost:3000/api/v1/health
- Swagger: http://localhost:3000/docs

El servicio `init` genera los secretos (contraseña de la base de datos y claves JWT) en un volumen; no hay secretos en el repositorio. Para apagar sin borrar datos: `docker compose stop`.

### Desarrollo local sin Docker

1. Copiar `.env.example` a `backend/.env` y completar `DATABASE_URL` y las claves JWT.
2. `npm ci`
3. `npm run dev:api` (compila y arranca la API en el puerto 3000; las migraciones se aplican al iniciar).
4. `npm run dev:web` (Vite en http://localhost:5173, envía `/api` al backend).

## Pruebas

```bash
npm run lint       # ESLint + verificación de tipos
npm test           # pruebas unitarias de dominio y aplicación (cobertura mínima 70 %)
npm run test:e2e   # pruebas e2e contra PostgreSQL (DATABASE_URL debe contener "test")
npm run build
```

## Estructura (arquitectura limpia)

```
backend/src/
  domain/          entidades, reglas puras y puertos (no depende de NestJS ni de TypeORM)
    rules/         reglas de negocio por módulo
  application/     casos de uso; solo dependen de los puertos del dominio
  infrastructure/  adaptadores: PostgreSQL (TypeORM), JWT/bcrypt, migraciones
  presentation/    controladores HTTP, DTOs con validación, filtro de errores, guard de acceso
  modules/         módulos de NestJS que unen cada caso de uso con sus adaptadores
frontend/src/      React + Vite: api.ts (cliente HTTP), ui.tsx (componentes), pages/
```

Cada módulo funcional (autenticación, inventario, monitoreo, intervenciones) tiene su archivo en cada capa y se registra con una línea en `backend/src/app.module.ts`.

## Equipo y roles Scrum

| Integrante | GitHub | Rol |
| --- | --- | --- |
| Gabriel Caicedo de la Iglesia | [@Yutaerre21](https://github.com/Yutaerre21) | Product Owner · Development Team |
| Leonel Triana Martínez | [@mogeko-cpu](https://github.com/mogeko-cpu) | Scrum Master · Development Team |
| Víctor Cantillo Valencia | [@vidcik](https://github.com/vidcik) | Development Team |
| Sebastián González Quintanilla | [@quintanillad](https://github.com/quintanillad) | Development Team |

## Flujo de trabajo

- `main`: versión entregable. Protegida, solo recibe PRs desde `develop` (o `fix/*` urgentes).
- `develop`: integración. Protegida, recibe los PRs de las ramas de trabajo.
- Ramas de trabajo cortas, una por issue: `feat/<issue>-descripcion`, `fix/<issue>-descripcion`, `docs/<issue>-descripcion`.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/): `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
- Todo PR lleva `Closes #<issue>`, describe qué cambia y cómo probarlo, y necesita **1 aprobación** de otro integrante antes de fusionarse.
- Una tarjeta pasa a **Done** solo cuando su PR está fusionado.

```bash
git checkout develop && git pull
git checkout -b feat/4-inventario-expedientes
# ...trabajo y commits...
git push -u origin feat/4-inventario-expedientes
# abrir PR hacia develop con "Closes #4"
```

## Definición de terminado

Código comprendido por sus autores, criterios de aceptación comprobados, pruebas y CI en verde, documentación actualizada y PR revisado y fusionado.
