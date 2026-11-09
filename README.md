# Proyecto Final Backend — P3: Monitoreo y alertas de conservación (CLENA)

Sistema para el Archivo Histórico del CLENA que reemplaza la evaluación manual y esporádica del estado de los documentos por un registro con historial, monitoreo ambiental y alertas tempranas.

- **Proyecto:** P3 — Monitoreo y alertas de conservación
- **Equipo de origen (cliente):** G7
- **Curso:** Backend — Universidad del Norte, 2026
- **Tablero Scrum:** [GitHub Project](https://github.com/users/mogeko-cpu/projects/1)
- **Backlog:** [Issues](https://github.com/mogeko-cpu/Proyecto-Final-Backend/issues)

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
