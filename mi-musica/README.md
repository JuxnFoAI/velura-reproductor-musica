# Biblioteca musical

Coloca aquí tus archivos MP3. El reproductor los indexará automáticamente al iniciar.

## Estructura

```
mi-musica/
├── Artista - Canción.mp3
├── portadas de canciones/   ← portadas (.jpg, .png, .webp)
├── Letras de canciones/     ← letras (.txt, .lrc)
├── cover-overrides.json     ← asociaciones manuales MP3 → portada (local, no se sube a Git)
├── cover-overrides.example.json  ← plantilla versionada
└── ejemplo/                 ← pistas de demo versionables en Git (ver ejemplo/README.md)
```

Los MP3 personales no deben subirse al repositorio. Esta carpeta está en `.gitignore`, salvo `ejemplo/`, la plantilla de overrides y estos archivos de estructura.

La demo incluida es **Duodedos — AFTER** (`ejemplo/Duodedos - AFTER.mp3`).

### Portadas con nombre distinto al MP3

Si la imagen no sigue la convención `Artista - Título.jpg`, copia `cover-overrides.example.json` a `cover-overrides.json` y mapea cada MP3 al nombre de su portada en `portadas de canciones/`.
