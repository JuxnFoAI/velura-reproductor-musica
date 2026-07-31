/** Copia la demo versionada a la biblioteca del usuario en el primer arranque de Electron. */
import fs from 'node:fs'
import path from 'node:path'
import {
  COVER_OVERRIDES_EXAMPLE_FILENAME,
  ensureMusicDirectoryStructure,
  EXAMPLE_DIRECTORY_NAME,
  LIBRARY_INITIALIZED_MARKER,
} from './musicDirectoryResolver'

export interface SeedMusicLibraryOptions {
  musicDirectory: string
  bundledExampleDirectory: string
  bundledCoverOverridesExamplePath?: string | null
}

/**
 * Prepara la biblioteca del usuario y copia `ejemplo/` solo la primera vez.
 */
export function seedMusicLibraryIfNeeded(options: SeedMusicLibraryOptions): string {
  const { musicDirectory, bundledExampleDirectory, bundledCoverOverridesExamplePath } = options
  ensureMusicDirectoryStructure(musicDirectory)

  const markerPath = path.join(musicDirectory, LIBRARY_INITIALIZED_MARKER)

  if (fs.existsSync(markerPath)) {
    return musicDirectory
  }

  copyBundledExampleDirectory(bundledExampleDirectory, musicDirectory)
  copyCoverOverridesExample(bundledCoverOverridesExamplePath, musicDirectory)

  fs.writeFileSync(markerPath, `initialized-at=${new Date().toISOString()}\n`, 'utf8')

  return musicDirectory
}

function copyBundledExampleDirectory(
  bundledExampleDirectory: string,
  musicDirectory: string,
): void {
  if (!fs.existsSync(bundledExampleDirectory)) {
    return
  }

  const targetExampleDirectory = path.join(musicDirectory, EXAMPLE_DIRECTORY_NAME)

  fs.cpSync(bundledExampleDirectory, targetExampleDirectory, {
    recursive: true,
    force: false,
    errorOnExist: false,
  })
}

function copyCoverOverridesExample(
  bundledCoverOverridesExamplePath: string | null | undefined,
  musicDirectory: string,
): void {
  if (!bundledCoverOverridesExamplePath || !fs.existsSync(bundledCoverOverridesExamplePath)) {
    return
  }

  const targetPath = path.join(musicDirectory, COVER_OVERRIDES_EXAMPLE_FILENAME)

  if (fs.existsSync(targetPath)) {
    return
  }

  fs.copyFileSync(bundledCoverOverridesExamplePath, targetPath)
}
