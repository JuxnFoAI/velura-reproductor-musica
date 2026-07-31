/** Resuelve y prepara la carpeta mi-musica del proyecto como biblioteca principal. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const VELURA_APP_FOLDER_NAME = 'Velura'
export const PROJECT_MUSIC_DIRECTORY_NAME = 'mi-musica'
export const EXAMPLE_DIRECTORY_NAME = 'ejemplo'
export const LIBRARY_INITIALIZED_MARKER = '.velura-library-initialized'
export const COVER_OVERRIDES_EXAMPLE_FILENAME = 'cover-overrides.example.json'
export const BUNDLED_MUSIC_EXAMPLE_RESOURCE_DIR = 'mi-musica-ejemplo'
export const BUNDLED_COVER_OVERRIDES_EXAMPLE_RESOURCE = 'mi-musica/cover-overrides.example.json'
export const COVERS_DIRECTORY = 'portadas de canciones'
export const LYRICS_DIRECTORY = 'Letras de canciones'

/**
 * Localiza la raíz del repo buscando package.json hacia arriba desde el módulo invocador.
 */
export function resolveProjectRootFromModule(moduleUrl: string): string {
  let currentDirectory = path.dirname(fileURLToPath(moduleUrl))

  while (currentDirectory !== path.dirname(currentDirectory)) {
    if (fs.existsSync(path.join(currentDirectory, 'package.json'))) {
      return currentDirectory
    }

    currentDirectory = path.dirname(currentDirectory)
  }

  return path.dirname(fileURLToPath(moduleUrl))
}

/**
 * Crea la carpeta mi-musica y sus subcarpetas de portadas y letras si no existen.
 */
export function ensureMusicDirectoryStructure(musicDirectory: string): string {
  fs.mkdirSync(musicDirectory, { recursive: true })
  fs.mkdirSync(path.join(musicDirectory, COVERS_DIRECTORY), { recursive: true })
  fs.mkdirSync(path.join(musicDirectory, LYRICS_DIRECTORY), { recursive: true })

  return musicDirectory
}

/**
 * Crea la carpeta mi-musica del proyecto y sus subcarpetas de portadas y letras.
 */
export function ensureProjectMusicDirectory(projectRoot: string): string {
  return ensureMusicDirectoryStructure(path.join(projectRoot, PROJECT_MUSIC_DIRECTORY_NAME))
}

/**
 * Resuelve la biblioteca del usuario en datos de aplicación (p. ej. %APPDATA%/Velura/mi-musica).
 */
export function resolveVeluraUserMusicDirectory(appDataPath: string): string {
  return path.join(appDataPath, VELURA_APP_FOLDER_NAME, PROJECT_MUSIC_DIRECTORY_NAME)
}
