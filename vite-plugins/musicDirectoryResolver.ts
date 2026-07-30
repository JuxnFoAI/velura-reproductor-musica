/** Resuelve y prepara la carpeta mi-musica del proyecto como biblioteca principal. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const PROJECT_MUSIC_DIRECTORY_NAME = 'mi-musica'
export const COVERS_DIRECTORY = 'portadas de canciones'
export const LYRICS_DIRECTORY = 'Letras de canciones'

/**
 * Obtiene la raíz del proyecto a partir de la URL del módulo que lo invoca.
 * @param moduleUrl - Valor de import.meta.url del módulo dentro de vite-plugins/.
 */
export function resolveProjectRootFromModule(moduleUrl: string): string {
  const moduleDirectory = path.dirname(fileURLToPath(moduleUrl))
  return path.resolve(moduleDirectory, '..')
}

/**
 * Crea la carpeta mi-musica y sus subcarpetas de portadas y letras si no existen.
 * @param projectRoot - Ruta absoluta de la raíz del proyecto.
 * @returns Ruta absoluta de la biblioteca musical del proyecto.
 */
export function ensureProjectMusicDirectory(projectRoot: string): string {
  const musicDirectory = path.join(projectRoot, PROJECT_MUSIC_DIRECTORY_NAME)

  fs.mkdirSync(musicDirectory, { recursive: true })
  fs.mkdirSync(path.join(musicDirectory, COVERS_DIRECTORY), { recursive: true })
  fs.mkdirSync(path.join(musicDirectory, LYRICS_DIRECTORY), { recursive: true })

  return musicDirectory
}
