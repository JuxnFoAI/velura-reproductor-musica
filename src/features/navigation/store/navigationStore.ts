/** Store del estado de navegación push de la aplicación. */

import { create } from 'zustand'

import { revokeCoverUrl } from '@features/musicPlayer'
import type { AudioQualityDestination, AudioQualitySubSection } from '@features/audioQuality'
import type { CustomizationDestination, CustomizationSubSection } from '@features/customization'
import type { MainMenuDestination, MainMenuSection } from '../types/mainMenu'
import type { PlaylistsSubSection } from '../types/playlistsMenu'
import type { SettingsDestination, SettingsSubSection } from '../types/settingsMenu'

export interface CoverAdjustSession {
  trackId: string
  imageUrl: string
}

export interface LyricsEditSession {
  trackId: string
  lyricsRelativePath: string
}

interface NavigationState {
  isPushScreenOpen: boolean
  isMainMenuOpen: boolean
  mainMenuSection: MainMenuSection
  playlistsSubSection: PlaylistsSubSection
  selectedPlaylistId: string | null
  settingsSubSection: SettingsSubSection
  customizationSubSection: CustomizationSubSection
  audioQualitySubSection: AudioQualitySubSection
  isShowingHiddenTracks: boolean
  isCoverAdjustScreenOpen: boolean
  isLyricsEditScreenOpen: boolean
  coverAdjustSession: CoverAdjustSession | null
  lyricsEditSession: LyricsEditSession | null
  openPushScreen: () => void
  closePushScreen: () => void
  togglePushScreen: () => void
  openMainMenu: () => void
  closeMainMenu: () => void
  toggleMainMenu: () => void
  openMainMenuSection: (section: MainMenuDestination) => void
  openPlaylistDetail: (playlistId: string) => void
  openAddSongsToPlaylist: () => void
  openRemoveSongsFromPlaylist: (playlistId: string) => void
  openSettingsSubSection: (section: SettingsDestination) => void
  openCustomizationSubSection: (section: CustomizationDestination) => void
  openAudioQualitySubSection: (section: AudioQualityDestination) => void
  goBackMainMenu: () => void
  resetPlaylistsSubSection: () => void
  resetSettingsSubSection: () => void
  resetCustomizationSubSection: () => void
  resetAudioQualitySubSection: () => void
  toggleHiddenTracksView: () => void
  resetHiddenTracksView: () => void
  openCoverAdjustScreen: (session: CoverAdjustSession) => void
  closeCoverAdjustScreen: () => void
  openLyricsEditScreen: (session: LyricsEditSession) => void
  closeLyricsEditScreen: () => void
}

function clearCoverAdjustSession(session: CoverAdjustSession | null): void {
  if (!session) {
    return
  }

  revokeCoverUrl(session.imageUrl)
}

function closeSongInfoScreens(set: (partial: Partial<NavigationState>) => void): void {
  set({
    isPushScreenOpen: false,
    isCoverAdjustScreenOpen: false,
    isLyricsEditScreenOpen: false,
    coverAdjustSession: null,
    lyricsEditSession: null,
  })
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  isPushScreenOpen: false,
  isMainMenuOpen: false,
  mainMenuSection: 'root',
  playlistsSubSection: 'root',
  selectedPlaylistId: null,
  settingsSubSection: 'root',
  customizationSubSection: 'root',
  audioQualitySubSection: 'root',
  isShowingHiddenTracks: false,
  isCoverAdjustScreenOpen: false,
  isLyricsEditScreenOpen: false,
  coverAdjustSession: null,
  lyricsEditSession: null,

  openPushScreen: () => set({ isPushScreenOpen: true, isMainMenuOpen: false }),

  closePushScreen: () => {
    const { coverAdjustSession } = get()
    clearCoverAdjustSession(coverAdjustSession)
    closeSongInfoScreens(set)
  },

  togglePushScreen: () => {
    const { isPushScreenOpen } = get()

    if (isPushScreenOpen) {
      get().closePushScreen()
      return
    }

    set({ isPushScreenOpen: true, isMainMenuOpen: false })
  },

  openMainMenu: () => {
    const { coverAdjustSession } = get()
    clearCoverAdjustSession(coverAdjustSession)
    set({
      isMainMenuOpen: true,
      mainMenuSection: 'root',
      playlistsSubSection: 'root',
      selectedPlaylistId: null,
      settingsSubSection: 'root',
      customizationSubSection: 'root',
      audioQualitySubSection: 'root',
      isPushScreenOpen: false,
      isCoverAdjustScreenOpen: false,
      isLyricsEditScreenOpen: false,
      coverAdjustSession: null,
      lyricsEditSession: null,
    })
  },

  closeMainMenu: () =>
    set({
      isMainMenuOpen: false,
      mainMenuSection: 'root',
      playlistsSubSection: 'root',
      selectedPlaylistId: null,
      settingsSubSection: 'root',
      customizationSubSection: 'root',
      audioQualitySubSection: 'root',
      isShowingHiddenTracks: false,
    }),

  toggleMainMenu: () => {
    const { isMainMenuOpen } = get()

    if (isMainMenuOpen) {
      get().closeMainMenu()
      return
    }

    get().openMainMenu()
  },

  openMainMenuSection: (section) =>
    set({
      mainMenuSection: section,
      playlistsSubSection: 'root',
      selectedPlaylistId: null,
      settingsSubSection: 'root',
      customizationSubSection: 'root',
      audioQualitySubSection: 'root',
    }),

  openPlaylistDetail: (playlistId) =>
    set({
      playlistsSubSection: 'detail',
      selectedPlaylistId: playlistId,
    }),

  openAddSongsToPlaylist: () => set({ playlistsSubSection: 'add-songs' }),

  openRemoveSongsFromPlaylist: (playlistId) =>
    set({
      playlistsSubSection: 'remove-songs',
      selectedPlaylistId: playlistId,
    }),

  openSettingsSubSection: (section) =>
    set({
      settingsSubSection: section,
      customizationSubSection: 'root',
      audioQualitySubSection: 'root',
    }),

  openCustomizationSubSection: (section) => set({ customizationSubSection: section }),

  openAudioQualitySubSection: (section) => set({ audioQualitySubSection: section }),

  goBackMainMenu: () => {
    const { mainMenuSection, playlistsSubSection, settingsSubSection, customizationSubSection, audioQualitySubSection } =
      get()

    if (mainMenuSection === 'playlists') {
      if (playlistsSubSection === 'add-songs') {
        set({ playlistsSubSection: 'detail' })
        return
      }

      if (playlistsSubSection === 'remove-songs') {
        set({ playlistsSubSection: 'root', selectedPlaylistId: null })
        return
      }

      if (playlistsSubSection === 'detail') {
        set({ playlistsSubSection: 'root', selectedPlaylistId: null })
        return
      }
    }

    if (mainMenuSection === 'settings') {
      if (settingsSubSection === 'customization' && customizationSubSection !== 'root') {
        set({ customizationSubSection: 'root' })
        return
      }

      if (settingsSubSection === 'audio-quality' && audioQualitySubSection !== 'root') {
        set({ audioQualitySubSection: 'root' })
        return
      }

      if (settingsSubSection !== 'root') {
        set({
          settingsSubSection: 'root',
          customizationSubSection: 'root',
          audioQualitySubSection: 'root',
        })
        return
      }
    }

    set({
      mainMenuSection: 'root',
      playlistsSubSection: 'root',
      selectedPlaylistId: null,
      settingsSubSection: 'root',
      customizationSubSection: 'root',
      audioQualitySubSection: 'root',
      isShowingHiddenTracks: false,
    })
  },

  resetPlaylistsSubSection: () =>
    set({ playlistsSubSection: 'root', selectedPlaylistId: null }),

  resetSettingsSubSection: () =>
    set({
      settingsSubSection: 'root',
      customizationSubSection: 'root',
      audioQualitySubSection: 'root',
    }),

  resetCustomizationSubSection: () => set({ customizationSubSection: 'root' }),

  resetAudioQualitySubSection: () => set({ audioQualitySubSection: 'root' }),

  toggleHiddenTracksView: () =>
    set((state) => ({ isShowingHiddenTracks: !state.isShowingHiddenTracks })),

  resetHiddenTracksView: () => set({ isShowingHiddenTracks: false }),

  openCoverAdjustScreen: (session) =>
    set({
      isCoverAdjustScreenOpen: true,
      coverAdjustSession: session,
    }),

  closeCoverAdjustScreen: () => {
    const { coverAdjustSession } = get()
    clearCoverAdjustSession(coverAdjustSession)

    set({
      isCoverAdjustScreenOpen: false,
      coverAdjustSession: null,
    })
  },

  openLyricsEditScreen: (session) =>
    set({
      isLyricsEditScreenOpen: true,
      lyricsEditSession: session,
    }),

  closeLyricsEditScreen: () =>
    set({
      isLyricsEditScreenOpen: false,
      lyricsEditSession: null,
    }),
}))
