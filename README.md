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

> **Importante:** La biblioteca musical requiere el servidor de Vite (dev o preview) porque los endpoints `/api/music/*` sirven los archivos desde `mi-musica/`. Un build estático (`dist/`) por sí solo no incluye la API de biblioteca.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Typecheck + bundle de producción |
| `npm run preview` | Sirve `dist/` con el plugin de biblioteca |
| `npm run lint` | ESLint sobre todo el proyecto |

## Estructura del proyecto

```
mi-musica/                         # Biblioteca MP3 local (gitignored)
desktop/                           # Reservado para empaquetado Electron
vite-plugins/
  musicLibraryPlugin.ts            # API HTTP de biblioteca (dev/preview)
  musicDirectoryResolver.ts        # Resolución de carpeta mi-musica
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
- [desktop/README.md](./desktop/README.md) — Plan de empaquetado con Electron (próxima fase)
- [mi-musica/README.md](./mi-musica/README.md) — Convenciones de la biblioteca musical

## Próxima fase: Electron

La aplicación está preparada para empaquetarse como app de escritorio. El código ya detecta el entorno desktop (`window.__REPRODUCTOR_DESKTOP__`) y habilita la Isla dinámica. La lógica de `musicLibraryPlugin.ts` deberá migrarse al proceso principal de Electron con IPC.

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
