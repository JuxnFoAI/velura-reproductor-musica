/** Resuelve la carpeta mi-musica usada por el proceso main de Electron. */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'
import {
  BUNDLED_COVER_OVERRIDES_EXAMPLE_RESOURCE,
  BUNDLED_MUSIC_EXAMPLE_RESOURCE_DIR,
  COVER_OVERRIDES_EXAMPLE_FILENAME,
  ensureProjectMusicDirectory,
  EXAMPLE_DIRECTORY_NAME,
  PROJECT_MUSIC_DIRECTORY_NAME,
  resolveProjectRootFromModule,
  resolveVeluraUserMusicDirectory,
  seedMusicLibraryIfNeeded,
} from '../shared/musicLibrary'

const projectRoot = resolveProjectRootFromModule(import.meta.url)

let cachedMusicDirectory: string | null = null

function isElectronDevMode(): boolean {
  return process.argv.includes('--dev')
}

function shouldUseProjectMusicDirectory(): boolean {
  return !app.isPackaged && isElectronDevMode()
}

function resolveBundledExampleDirectory(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, BUNDLED_MUSIC_EXAMPLE_RESOURCE_DIR)
  }

  return path.join(projectRoot, PROJECT_MUSIC_DIRECTORY_NAME, EXAMPLE_DIRECTORY_NAME)
}

function resolveBundledCoverOverridesExamplePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, BUNDLED_COVER_OVERRIDES_EXAMPLE_RESOURCE)
  }

  return path.join(projectRoot, PROJECT_MUSIC_DIRECTORY_NAME, COVER_OVERRIDES_EXAMPLE_FILENAME)
}

function resolveMusicDirectoryPath(): string {
  if (shouldUseProjectMusicDirectory()) {
    return ensureProjectMusicDirectory(projectRoot)
  }

  const userMusicDirectory = resolveVeluraUserMusicDirectory(app.getPath('appData'))

  return seedMusicLibraryIfNeeded({
    musicDirectory: userMusicDirectory,
    bundledExampleDirectory: resolveBundledExampleDirectory(),
    bundledCoverOverridesExamplePath: resolveBundledCoverOverridesExamplePath(),
  })
}

/** Inicializa la biblioteca activa antes de registrar IPC o protocolos. */
export function initializeElectronMusicDirectory(): void {
  cachedMusicDirectory = resolveMusicDirectoryPath()
}

/** Devuelve la biblioteca musical activa según el entorno de Electron. */
export function getElectronMusicDirectory(): string {
  if (!cachedMusicDirectory) {
    cachedMusicDirectory = resolveMusicDirectoryPath()
  }

  return cachedMusicDirectory
}

/** Ruta del bundle de Electron (desktop/dist); útil para depuración en desarrollo. */
export function getDesktopBundleDirectory(): string {
  return path.dirname(fileURLToPath(import.meta.url))
}
