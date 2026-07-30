# Empaquetado de escritorio (Electron)

Esta carpeta está reservada para la **fase de empaquetado con Electron**.

## Estado actual

La aplicación funciona como cliente web con Vite. La biblioteca musical se sirve mediante el plugin `vite-plugins/musicLibraryPlugin.ts`, que expone endpoints `/api/music/*` en el servidor de desarrollo y preview.

## Próximos pasos

1. **Proceso principal** — Mover la lógica de `musicLibraryPlugin.ts` al main process de Electron (acceso a `mi-musica/` vía Node.js).
2. **Preload** — Exponer `window.__REPRODUCTOR_DESKTOP__ = true` y una API IPC equivalente a los endpoints actuales.
3. **Renderer** — Mantener el bundle React existente; `localMusicLibraryService.ts` consumirá IPC en escritorio y HTTP en desarrollo web.
4. **Empaquetado** — Configurar `electron-builder` o Electron Forge para generar instaladores.

## Referencias en el código

- `src/lib/runtimeEnvironment.ts` — Detección de app de escritorio.
- `src/features/musicPlayer/hooks/useDynamicIslandVisibility.ts` — Isla dinámica habilitada en desktop.
