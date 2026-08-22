# Empaquetado de escritorio (Electron)

Velura usa Electron para la app de escritorio. La lógica de biblioteca vive en [`shared/musicLibrary/`](../shared/musicLibrary/) y se expone al renderer por IPC y protocolo de medios.

## Estado actual

| Fase | Estado | Descripción |
|------|--------|-------------|
| 5 | Completada | Módulo compartido `shared/musicLibrary/` |
| 6 | Completada | Main, preload, IPC y protocolo `velura-media://` |
| 7 | Completada | `localMusicLibraryService.ts` usa transporte IPC en desktop |
| 8 | Completada | Vite `base: './'`, build integrado main/preload/renderer |
| 9 | Completada | Biblioteca en `%APPDATA%/Velura/mi-musica/` |
| 10 | Completada | `electron-builder`, instalador NSIS `.exe` |

## Arquitectura

```
desktop/
├── main.ts                          # Ventana, ciclo de vida, registra IPC y protocolo
├── preload.ts                       # __REPRODUCTOR_DESKTOP__ + veluraMusicLibrary
├── musicDirectory.ts                # mi-musica/ en dev; APPDATA en producción
├── ipc/registerMusicLibraryIpc.ts   # Handlers ipcMain → shared/musicLibrary
└── media/registerMediaProtocol.ts   # velura-media://audio|cover|lyrics
```

### IPC (equivalente a `/api/music/*`)

| HTTP (Vite) | IPC | Función compartida |
|-------------|-----|-------------------|
| `GET /api/music/tracks` | `velura:music:get-tracks` | `buildMusicLibrary` |
| `PUT /api/music/cover` | `velura:music:save-cover` | `saveTrackCover` |
| `PUT /api/music/lyrics` | `velura:music:save-lyrics` | `saveTrackLyrics` |
| `PUT /api/music/track` | `velura:music:rename-track` | `renameTrack` |
| `DELETE /api/music/track` | `velura:music:delete-track` | `deleteTrack` |

### Medios binarios

En desktop, el preload expone URLs del protocolo personalizado:

- `velura-media://audio/?path=...`
- `velura-media://cover/?path=...`
- `velura-media://lyrics/?path=...`

Helpers: `window.veluraMusicLibrary.buildAudioUrl()`, `buildCoverUrl()`, `buildLyricsUrl()`.

## Desarrollo

Requiere **dos terminales**:

```bash
# Terminal 1 — renderer (Vite + plugin HTTP para comparar en navegador)
npm run dev

# Terminal 2 — Electron (ajusta el puerto si Vite no usa 5173)
# PowerShell:
$env:VITE_DEV_SERVER_URL='http://localhost:5173'; npm run electron:dev

# DevTools (opcional; ya no se abren automáticamente):
$env:VELURA_OPEN_DEVTOOLS='1'; npm run electron:dev
```

Vite en desarrollo escucha solo en `localhost`. El plugin HTTP de biblioteca (`/api/music/*`) se activa **solo** en `npm run dev`, no en `npm run preview`.

Para probar el build estático del renderer sin instalador:

```bash
npm run electron:start
```

## Empaquetado (instalador Windows)

Genera `release/Velura Setup x.x.x.exe`:

```bash
npm run electron:pack
```

El script:

1. Genera `build/icon.ico` desde `build/icon.svg`
2. Compila renderer (`dist/`) y main/preload (`desktop/dist/`)
3. Ejecuta `electron-builder` con NSIS

### Contenido del instalador

| Recurso | Destino en el paquete |
|---------|------------------------|
| Renderer | `dist/` dentro del `.asar` |
| Main/preload | `desktop/dist/` dentro del `.asar` |
| Demo musical | `resources/mi-musica-ejemplo/` |
| Plantilla portadas | `resources/mi-musica/cover-overrides.example.json` |

La biblioteca del usuario **no** se incluye. En el primer arranque se crea `%APPDATA%\Velura\mi-musica\` y se copia la demo desde `resources/mi-musica-ejemplo/`.

### Checklist post-instalación

| Área | Qué verificar |
|------|---------------|
| Biblioteca | Indexa MP3; demo en `ejemplo/` al primer arranque |
| Reproducción | Audio vía `velura-media://` |
| Portadas | Carga y guardado |
| Letras | `.lrc` / `.txt` |
| Privacidad | Nada personal del repo en el instalador |

## Compilación del proceso main

```bash
npm run build:desktop
```

Salida en `desktop/dist/main.js` (ESM) y `desktop/dist/preload.js` (CJS, el sandbox del renderer no carga ESM). Entry point: `package.json` → `"main": "desktop/dist/main.js"`.

## Referencias

- [`shared/musicLibrary/`](../shared/musicLibrary/) — Lógica compartida
- [`vite-plugins/musicLibraryPlugin.ts`](../vite-plugins/musicLibraryPlugin.ts) — Capa HTTP (solo dev)
- [`src/lib/runtimeEnvironment.ts`](../src/lib/runtimeEnvironment.ts) — Detección desktop
- [`src/types/veluraDesktop.d.ts`](../src/types/veluraDesktop.d.ts) — Tipos del bridge preload
