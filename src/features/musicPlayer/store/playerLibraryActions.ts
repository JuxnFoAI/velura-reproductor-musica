/** Acciones de biblioteca: carga, favoritos, visibilidad, portada, metadatos y letras. */
import { audioEngine } from '../services/audioEngine'
import { revokeCoverUrl } from '../services/fileService'
import {
  deleteTrackFromLibrary,
  renameTrackInLibrary,
  saveTrackCoverToLibrary,
  saveTrackLyricsToLibrary,
} from '../services/localMusicLibraryService'
import {
  isValidLyricsFile,
  readLyricsFile,
  resolveLyricsExtension,
  resolveLyricsExtensionFromRelativePath,
} from '../services/lyricsFileService'
import { resolveVisibleLibraryTracks } from '../lib/resolveVisibleLibraryTracks'
import type { Track } from '../types'
import { resetTrackHistory, syncActiveQueueWithLibrary } from './playerQueueLogic'
import {
  persistSettings,
  showErrorToast,
  TRACK_FADE_MS,
} from './playerStoreRuntime'
import {
  bumpLyricsContentRevision,
  isSameTrackLibrary,
  removeTrackFromState,
  replaceTrackInState,
  revokeQueueUrls,
  updateTrackCoverInState,
  updateTrackLyricsInState,
} from './playerTrackState'
import { toastStore } from './toastStore'
import type { PlayerActions, PlayerStoreGet, PlayerStoreSet } from './playerStoreTypes'

type LibraryActions = Pick<
  PlayerActions,
  | 'loadLibraryTracks'
  | 'updateTrackDurations'
  | 'toggleFavorite'
  | 'hideTrack'
  | 'showTrack'
  | 'deleteTrack'
  | 'updateTrackCover'
  | 'updateTrackMetadata'
  | 'attachTrackLyrics'
  | 'saveTrackLyricsContent'
>

function resolveMetadataUpdateSuccessMessage(metadata: {
  title?: string
  artist?: string
}): string {
  if (metadata.title !== undefined && metadata.artist !== undefined) {
    return 'Información de la canción actualizada correctamente.'
  }

  if (metadata.title !== undefined) {
    return 'Nombre de la canción actualizado correctamente.'
  }

  return 'Nombre del artista actualizado correctamente.'
}

async function syncAudioAfterTrackRename(
  get: PlayerStoreGet,
  set: PlayerStoreSet,
  renamedTrack: Track,
): Promise<void> {
  const state = get()

  if (state.currentTrack?.id !== renamedTrack.id) {
    return
  }

  const wasPlaying = state.status === 'playing'
  const preservedTime = state.currentTime

  try {
    const loaded = await audioEngine.loadTrack(renamedTrack)

    if (!loaded) {
      return
    }

    await audioEngine.seek(preservedTime)

    if (wasPlaying) {
      await audioEngine.playWithFadeIn(TRACK_FADE_MS)
    }

    set((currentState) => ({
      ...currentState,
      status: wasPlaying ? 'playing' : currentState.status,
    }))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo recargar la pista renombrada.'

    showErrorToast(message)
  }
}

export function createLibraryActions(
  set: PlayerStoreSet,
  get: PlayerStoreGet,
): LibraryActions {
  return {
    loadLibraryTracks: (tracks) => {
      const state = get()

      if (isSameTrackLibrary(state.libraryQueue, tracks)) {
        set((currentState) => {
          const visibleLibraryQueue = resolveVisibleLibraryTracks(
            tracks,
            currentState.hiddenTrackIds,
          )

          return {
            ...currentState,
            libraryQueue: tracks,
            queue:
              currentState.queueContext === 'library'
                ? syncActiveQueueWithLibrary(visibleLibraryQueue, currentState.queue)
                : currentState.queue,
          }
        })
        return
      }

      audioEngine.stop()
      revokeQueueUrls(state.libraryQueue)
      resetTrackHistory()

      const visibleLibraryQueue = resolveVisibleLibraryTracks(tracks, state.hiddenTrackIds)

      set((currentState) => ({
        ...currentState,
        libraryQueue: tracks,
        queue: visibleLibraryQueue,
        queueContext: 'library',
        currentTrack: null,
        status: 'idle',
        currentTime: 0,
        duration: 0,
      }))
    },

    updateTrackDurations: (tracks) => {
      const durationById = new Map(tracks.map((track) => [track.id, track.duration]))

      set((state) => {
        const mapTrackDuration = (track: Track): Track => {
          const duration = durationById.get(track.id)

          if (duration === undefined || duration <= 0 || duration === track.duration) {
            return track
          }

          return { ...track, duration }
        }

        const queue = state.queue.map(mapTrackDuration)
        const libraryQueue = state.libraryQueue.map(mapTrackDuration)
        const currentTrack = state.currentTrack
        const nextCurrentDuration =
          currentTrack !== null ? durationById.get(currentTrack.id) : undefined
        const nextCurrentTrack =
          currentTrack !== null &&
          nextCurrentDuration !== undefined &&
          nextCurrentDuration > 0 &&
          nextCurrentDuration !== currentTrack.duration
            ? { ...currentTrack, duration: nextCurrentDuration }
            : currentTrack

        return {
          ...state,
          queue,
          libraryQueue,
          currentTrack: nextCurrentTrack,
          duration:
            nextCurrentTrack !== null &&
            state.currentTrack?.id === nextCurrentTrack.id &&
            nextCurrentDuration !== undefined &&
            nextCurrentDuration > 0
              ? nextCurrentDuration
              : state.duration,
        }
      })
    },

    toggleFavorite: () => {
      const { currentTrack, favoriteTrackIds } = get()

      if (!currentTrack) {
        return
      }

      const isFavorite = favoriteTrackIds.includes(currentTrack.id)
      const nextFavoriteTrackIds = isFavorite
        ? favoriteTrackIds.filter((trackId) => trackId !== currentTrack.id)
        : [...favoriteTrackIds, currentTrack.id]

      set({ favoriteTrackIds: nextFavoriteTrackIds })
      persistSettings({ ...get(), favoriteTrackIds: nextFavoriteTrackIds })

      toastStore.getState().addToast({
        type: isFavorite ? 'remove' : 'success',
        message: isFavorite
          ? `"${currentTrack.title}" se quitó de favoritos.`
          : `"${currentTrack.title}" se añadió a favoritos.`,
      })
    },

    hideTrack: (trackId) => {
      const state = get()
      const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

      if (!targetTrack || state.hiddenTrackIds.includes(trackId)) {
        return
      }

      const nextHiddenTrackIds = [...state.hiddenTrackIds, trackId]
      const nextFavoriteTrackIds = state.favoriteTrackIds.filter((id) => id !== trackId)
      const nextQueue =
        state.queueContext === 'library'
          ? resolveVisibleLibraryTracks(state.libraryQueue, nextHiddenTrackIds)
          : state.queue

      set({
        hiddenTrackIds: nextHiddenTrackIds,
        favoriteTrackIds: nextFavoriteTrackIds,
        queue: nextQueue,
      })
      persistSettings({
        ...get(),
        hiddenTrackIds: nextHiddenTrackIds,
        favoriteTrackIds: nextFavoriteTrackIds,
      })

      toastStore.getState().addToast({
        type: 'remove',
        message: `"${targetTrack.title}" se ocultó de la biblioteca.`,
      })
    },

    showTrack: (trackId) => {
      const state = get()
      const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

      if (!targetTrack || !state.hiddenTrackIds.includes(trackId)) {
        return
      }

      const nextHiddenTrackIds = state.hiddenTrackIds.filter((id) => id !== trackId)
      const nextQueue =
        state.queueContext === 'library'
          ? resolveVisibleLibraryTracks(state.libraryQueue, nextHiddenTrackIds)
          : state.queue

      set({ hiddenTrackIds: nextHiddenTrackIds, queue: nextQueue })
      persistSettings({ ...get(), hiddenTrackIds: nextHiddenTrackIds })

      toastStore.getState().addToast({
        type: 'success',
        message: `"${targetTrack.title}" volvió a la biblioteca.`,
      })
    },

    deleteTrack: (trackId) => {
      const state = get()
      const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

      if (!targetTrack) {
        return
      }

      if (!targetTrack.relativePath) {
        showErrorToast('Esta pista no pertenece a la biblioteca local.')
        return
      }

      void deleteTrackFromLibrary({
        relativePath: targetTrack.relativePath,
        coverRelativePath: targetTrack.coverRelativePath,
        lyricsRelativePath: targetTrack.lyricsRelativePath,
      })
        .then(() => {
          removeTrackFromState(set, get, trackId, targetTrack)

          toastStore.getState().addToast({
            type: 'remove',
            message: `"${targetTrack.title}" se eliminó de la biblioteca.`,
          })
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : 'No se pudo eliminar la canción de la biblioteca.'

          showErrorToast(message)
        })
    },

    updateTrackCover: (trackId, coverUrl) => {
      const state = get()
      const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

      if (!targetTrack) {
        return
      }

      if (!targetTrack.relativePath) {
        showErrorToast('Esta pista no pertenece a la biblioteca local.')
        return
      }

      revokeCoverUrl(targetTrack.coverUrl)
      updateTrackCoverInState(set, trackId, coverUrl)

      void saveTrackCoverToLibrary(
        {
          relativePath: targetTrack.relativePath,
          coverRelativePath: targetTrack.coverRelativePath,
        },
        coverUrl,
      )
        .then(({ coverRelativePath, coverUrl: libraryCoverUrl }) => {
          if (coverUrl.startsWith('blob:')) {
            revokeCoverUrl(coverUrl)
          }

          updateTrackCoverInState(set, trackId, libraryCoverUrl, coverRelativePath)
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : 'No se pudo guardar la portada permanentemente.'

          showErrorToast(message)
        })
    },

    updateTrackMetadata: (trackId, metadata) => {
      const state = get()
      const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

      if (!targetTrack) {
        return
      }

      if (!targetTrack.relativePath) {
        showErrorToast('Esta pista no pertenece a la biblioteca local.')
        return
      }

      const nextTitle = metadata.title?.trim()
      const nextArtist = metadata.artist?.trim()

      if (nextTitle !== undefined && !nextTitle) {
        showErrorToast('El nombre de la canción no puede estar vacío.')
        return
      }

      if (nextArtist !== undefined && !nextArtist) {
        showErrorToast('El nombre del artista no puede estar vacío.')
        return
      }

      const mergedTitle = nextTitle ?? targetTrack.title
      const mergedArtist = nextArtist ?? targetTrack.artist

      if (mergedTitle === targetTrack.title && mergedArtist === targetTrack.artist) {
        return
      }

      const previousTrackSnapshot = { ...targetTrack }
      const optimisticTrack: Track = {
        ...targetTrack,
        title: mergedTitle,
        artist: mergedArtist,
      }

      replaceTrackInState(set, trackId, optimisticTrack)

      void renameTrackInLibrary({
        relativePath: targetTrack.relativePath,
        title: mergedTitle,
        artist: mergedArtist,
        coverRelativePath: targetTrack.coverRelativePath,
      })
        .then(async (result) => {
          const renamedTrack: Track = {
            ...targetTrack,
            id: result.id,
            title: result.title,
            artist: result.artist,
            relativePath: result.relativePath,
            src: result.src,
            coverRelativePath: result.coverRelativePath,
            coverUrl: result.coverUrl,
            lyricsRelativePath: result.lyricsRelativePath,
          }

          replaceTrackInState(set, trackId, renamedTrack)
          await syncAudioAfterTrackRename(get, set, renamedTrack)

          toastStore.getState().addToast({
            type: 'success',
            message: resolveMetadataUpdateSuccessMessage(metadata),
          })
        })
        .catch((error: unknown) => {
          replaceTrackInState(set, trackId, previousTrackSnapshot)

          const message =
            error instanceof Error
              ? error.message
              : 'No se pudo renombrar el archivo de la canción.'

          showErrorToast(message)
        })
    },

    attachTrackLyrics: (trackId, lyricsFile) => {
      const state = get()
      const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

      if (!targetTrack) {
        return
      }

      if (!targetTrack.relativePath) {
        showErrorToast('Esta pista no pertenece a la biblioteca local.')
        return
      }

      if (!isValidLyricsFile(lyricsFile)) {
        showErrorToast('Selecciona un archivo de letra .txt o .lrc válido.')
        return
      }

      const lyricsExtension = resolveLyricsExtension(lyricsFile.name)

      if (!lyricsExtension) {
        showErrorToast('Selecciona un archivo de letra .txt o .lrc válido.')
        return
      }

      void readLyricsFile(lyricsFile)
        .then((lyricsContent) => {
          if (!lyricsContent.trim()) {
            throw new Error('El archivo de letra está vacío.')
          }

          return saveTrackLyricsToLibrary(
            { relativePath: targetTrack.relativePath! },
            lyricsContent,
            lyricsExtension,
            targetTrack.lyricsRelativePath,
            lyricsFile.name,
          )
        })
        .then(({ lyricsRelativePath }) => {
          updateTrackLyricsInState(set, trackId, lyricsRelativePath)
          bumpLyricsContentRevision(set, trackId)
          toastStore.getState().addToast({
            type: 'success',
            message: 'Letra agregada correctamente.',
          })
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : 'No se pudo guardar la letra seleccionada.'

          showErrorToast(message)
        })
    },

    saveTrackLyricsContent: async (trackId, lyricsContent) => {
      const state = get()
      const targetTrack = state.libraryQueue.find((track) => track.id === trackId)

      if (!targetTrack) {
        throw new Error('No se encontró la pista seleccionada.')
      }

      if (!targetTrack.relativePath) {
        throw new Error('Esta pista no pertenece a la biblioteca local.')
      }

      if (!targetTrack.lyricsRelativePath) {
        throw new Error('Esta pista no tiene un archivo de letra asociado.')
      }

      const lyricsExtension = resolveLyricsExtensionFromRelativePath(
        targetTrack.lyricsRelativePath,
      )

      if (!lyricsExtension) {
        throw new Error('El archivo de letra asociado no es válido.')
      }

      const result = await saveTrackLyricsToLibrary(
        { relativePath: targetTrack.relativePath },
        lyricsContent,
        lyricsExtension,
        targetTrack.lyricsRelativePath,
      )

      updateTrackLyricsInState(set, trackId, result.lyricsRelativePath)
      bumpLyricsContentRevision(set, trackId)
    },
  }
}
