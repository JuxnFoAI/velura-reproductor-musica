/** Store Zustand del reproductor: ensambla estado, playback y biblioteca. */
import { create } from 'zustand'
import { bindAudioEngineToPlayerStore } from './bindAudioEngineToPlayerStore'
import { createLibraryActions } from './playerLibraryActions'
import { createPlaybackActions } from './playerPlaybackActions'
import { createInitialPlayerState } from './playerStoreRuntime'
import type { PlayerStore } from './playerStoreTypes'

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...createInitialPlayerState(),
  lyricsContentRevisions: {},
  ...createPlaybackActions(set, get),
  ...createLibraryActions(set, get),
}))

/** Acceso al store fuera de componentes React. */
export const playerStore = usePlayerStore

bindAudioEngineToPlayerStore(playerStore)
