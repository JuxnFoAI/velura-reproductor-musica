# Velura

Reproductor de música local con motor Web Audio, biblioteca indexada desde disco, letras sincronizadas (LRC), portadas editables, listas de reproducción y personalización completa de la interfaz.

> **Nombre del producto:** Velura · **Nombre del paquete npm:** `reproductor-of-music`

## Características

- Reproducción con **Web Audio API** (ecualizador, normalización de volumen, analizador)
- Biblioteca local desde la carpeta `mi-musica/`
- Letras sincronizadas (`.lrc`) y letras en texto plano (`.txt`)
- Portadas editables con recorte y persistencia en disco
- Listas de reproducción, favoritos y pistas ocultas
- **Isla dinámica** en escritorio (widget flotante con controles rápidos)
- Personalización: fondo, colores, fuentes, tamaño de letra e isla dinámica
- Persistencia de sesión y preferencias en `localStorage`

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
git clone https://github.com/JuxnFoAI/velura.git
cd velura
npm install
```

## Biblioteca musical

El reproductor lee los MP3 desde `mi-musica/` en la raíz del proyecto. Al iniciar el servidor de desarrollo se crea automáticamente si no existe, junto con:

- `mi-musica/portadas de canciones/` — imágenes de portada
- `mi-musica/Letras de canciones/` — archivos `.txt` o `.lrc`

Copia tus archivos MP3 a `mi-musica/`. Convención recomendada: `Artista - Título.mp3`.

Incluida en el repositorio hay una pista de demo en `mi-musica/ejemplo/Duodedos - AFTER.mp3` para probar el reproductor al clonar. Tu biblioteca personal va en la raíz de `mi-musica/`, no en `ejemplo/`.

> Los MP3 personales están en `.gitignore` y **no deben subirse al repositorio**. Solo se versiona la estructura de carpetas y la demo en `ejemplo/`. Consulta [mi-musica/README.md](./mi-musica/README.md).

## Desarrollo

```bash
npm run dev
```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

## Build y preview

```bash
npm run build
npm run preview
```

`npm run preview` sirve el bundle estático de `dist/` en el navegador. **No incluye la biblioteca musical**: el plugin `/api/music/*` solo se activa en `npm run dev` (ver `vite.config.ts`).

| Objetivo | Comando |
|----------|---------|
| Desarrollo en navegador con `mi-musica/` | `npm run dev` |
| Ver el bundle de producción en navegador (sin biblioteca) | `npm run build` + `npm run preview` |
| Probar build completo con biblioteca local | `npm run electron:start` |

> **Importante:** En el navegador, la biblioteca musical requiere `npm run dev` porque los endpoints `/api/music/*` sirven los archivos desde `mi-musica/`. La **app de escritorio** (`electron:dev`, `electron:start` o el instalador) no depende de Vite: usa IPC y el protocolo `velura-media://`.

## App de escritorio (Electron)

### Desarrollo

```bash
# Terminal 1
npm run dev

# Terminal 2 (PowerShell; ajusta el puerto si Vite no usa 5173)
$env:VITE_DEV_SERVER_URL='http://localhost:5173'; npm run electron:dev
```

### Probar build sin instalador

```bash
npm run electron:start
```

Usa `dist/` empaquetado y biblioteca en `%APPDATA%\Velura\mi-musica\`.

### Instalador Windows

```bash
npm run electron:pack
```

Genera `release/Velura Setup x.x.x.exe`. Al instalar:

- La app va a Program Files (o la ruta que elija el usuario).
- En el primer arranque crea `%APPDATA%\Velura\mi-musica\` y copia la pista demo.
- Reproduce, edita portadas/letras y muestra la isla dinámica sin Vite ni la carpeta del proyecto.

Detalle en [desktop/README.md](./desktop/README.md).

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Typecheck + bundle de producción |
| `npm run preview` | Sirve `dist/` estático (sin API de biblioteca) |
| `npm run electron:dev` | Electron en modo dev (requiere Vite) |
| `npm run electron:start` | Electron con renderer compilado |
| `npm run electron:pack` | Instalador NSIS `.exe` en `release/` |
| `npm run lint` | ESLint sobre todo el proyecto |

## Estructura del proyecto

```
mi-musica/                         # Biblioteca MP3 local (gitignored)
shared/musicLibrary/               # Lógica Node compartida (Vite + Electron)
desktop/                           # Electron: main, preload, IPC, protocolo velura-media
vite-plugins/
  musicLibraryPlugin.ts            # Capa HTTP sobre shared/musicLibrary
src/
  App.tsx                          # Raíz de la aplicación
  components/                      # UI compartida (diálogos, botones, intro)
  features/
    audioQuality/                  # Ecualizador y normalización de volumen
    customization/                 # Fuentes, colores, fondo, isla dinámica
    musicPlayer/                   # Motor, biblioteca, controles, isla dinámica
    navigation/                    # Menús push, pantallas de edición
  hooks/                           # Hooks globales (bootstrap de la app)
  lib/                             # Utilidades compartidas
  styles/globals.css               # Tokens CSS y estilos globales
```

Cada feature expone su API pública mediante un `index.ts`. Imports recomendados:

```ts
import { MusicPlayer, usePlayerStore } from '@features/musicPlayer'
import { useCustomizationStore } from '@features/customization'
import { useNavigationStore } from '@features/navigation'
```

## Stack tecnológico

React 19 · TypeScript · Vite · Zustand · Tailwind CSS · Web Audio API · Lucide Icons

## Documentación adicional

- [DECISIONS.md](./DECISIONS.md) — Decisiones de diseño y arquitectura
- [desktop/README.md](./desktop/README.md) — Electron, empaquetado e instalador
- [mi-musica/README.md](./mi-musica/README.md) — Convenciones de la biblioteca musical

## Licencia

El **código fuente** de Velura se publica bajo [MIT](./LICENSE).

La **música, portadas y letras** que añadas en `mi-musica/` (fuera de `ejemplo/`) son responsabilidad tuya. No subas contenido con copyright ajeno. La pista demo en `ejemplo/` está incluida expresamente para probar el reproductor al clonar el repositorio.

## Publicar en GitHub

Antes del primer push, verifica que no se suba biblioteca personal:

```bash
git add -n .
```

No deben aparecer MP3, `.lrc` ni portadas fuera de `mi-musica/ejemplo/`. Luego:

```bash
git add .
git commit -m "Initial commit: Velura v1.0.0"
git branch -M main
git remote add origin https://github.com/JuxnFoAI/velura.git
git push -u origin main
```
