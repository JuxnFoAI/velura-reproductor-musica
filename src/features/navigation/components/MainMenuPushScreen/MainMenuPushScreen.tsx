/** Pantalla push del menú principal de la aplicación. */

import { useCallback, useEffect, useState } from 'react'
import { Cog, Heart, ListMusic, Music2 } from 'lucide-react'

import { usePlaylistsStore } from '@features/musicPlayer/store/playlistsStore'
import { usePushScreenVisibility } from '../../hooks'
import { useNavigationStore } from '../../store'
import {
  MAIN_MENU_ALL_SONGS_HIDDEN_TITLE,
  MAIN_MENU_OPTIONS,
  MAIN_MENU_SECTION_TITLES,
  type MainMenuDestination,
} from '../../types/mainMenu'
import { CUSTOMIZATION_SUBSECTION_TITLES } from '../../types/customizationMenu'
import { AUDIO_QUALITY_SUBSECTION_TITLES } from '../../types/audioQualityMenu'
import { PLAYLISTS_ADD_SONGS_TITLE, PLAYLISTS_REMOVE_SONGS_TITLE } from '../../types/playlistsMenu'
import { SETTINGS_SUBSECTION_TITLES } from '../../types/settingsMenu'
import { MainMenuAllSongsOptionsMenu } from './MainMenuAllSongsOptionsMenu'
import { MainMenuAllSongsSection } from './MainMenuAllSongsSection'
import { MainMenuAudioQualityOptionsMenu } from './MainMenuAudioQualityOptionsMenu'
import { MainMenuBrandFooter } from './MainMenuBrandFooter'
import { MainMenuCustomizationFontsOptionsMenu } from './MainMenuCustomizationFontsOptionsMenu'
import { MainMenuFavoritesSection } from './MainMenuFavoritesSection'
import { MainMenuNavItem } from './MainMenuNavItem'
import { MainMenuPlaylistsSection } from './MainMenuPlaylistsSection'
import { MainMenuSettingsSection } from './MainMenuSettingsSection'

const MAIN_MENU_ICONS: Record<MainMenuDestination, typeof Music2> = {
  'all-songs': Music2,
  playlists: ListMusic,
  favorites: Heart,
  settings: Cog,
}

/**
 * Panel deslizable con el menú principal y sus secciones internas.
 */
export function MainMenuPushScreen() {
  const isMainMenuOpen = useNavigationStore((state) => state.isMainMenuOpen)
  const mainMenuSection = useNavigationStore((state) => state.mainMenuSection)
  const playlistsSubSection = useNavigationStore((state) => state.playlistsSubSection)
  const selectedPlaylistId = useNavigationStore((state) => state.selectedPlaylistId)
  const settingsSubSection = useNavigationStore((state) => state.settingsSubSection)
  const customizationSubSection = useNavigationStore((state) => state.customizationSubSection)
  const audioQualitySubSection = useNavigationStore((state) => state.audioQualitySubSection)
  const isShowingHiddenTracks = useNavigationStore((state) => state.isShowingHiddenTracks)
  const closeMainMenu = useNavigationStore((state) => state.closeMainMenu)
  const openMainMenuSection = useNavigationStore((state) => state.openMainMenuSection)
  const goBackMainMenu = useNavigationStore((state) => state.goBackMainMenu)
  const toggleHiddenTracksView = useNavigationStore((state) => state.toggleHiddenTracksView)
  const resetHiddenTracksView = useNavigationStore((state) => state.resetHiddenTracksView)
  const resetPlaylistsSubSection = useNavigationStore((state) => state.resetPlaylistsSubSection)
  const resetSettingsSubSection = useNavigationStore((state) => state.resetSettingsSubSection)
  const resetCustomizationSubSection = useNavigationStore(
    (state) => state.resetCustomizationSubSection,
  )
  const resetAudioQualitySubSection = useNavigationStore(
    (state) => state.resetAudioQualitySubSection,
  )
  const selectedPlaylist = usePlaylistsStore((state) =>
    selectedPlaylistId ? state.getPlaylistById(selectedPlaylistId) : undefined,
  )
  const { isMounted, isVisible } = usePushScreenVisibility(isMainMenuOpen)
  const [isAllSongsOptionsOpen, setIsAllSongsOptionsOpen] = useState(false)
  const [isFontsOptionsOpen, setIsFontsOptionsOpen] = useState(false)
  const [isAudioQualityOptionsOpen, setIsAudioQualityOptionsOpen] = useState(false)

  const isRootSection = mainMenuSection === 'root'
  const isAllSongsSection = mainMenuSection === 'all-songs'
  const isPlaylistsSection = mainMenuSection === 'playlists'
  const isSettingsSection = mainMenuSection === 'settings'
  const isFontsCustomizationSection =
    isSettingsSection &&
    settingsSubSection === 'customization' &&
    customizationSubSection === 'fonts'
  const isAudioQualityRootSection =
    isSettingsSection &&
    settingsSubSection === 'audio-quality' &&
    audioQualitySubSection === 'root'
  const sectionTitle = isAllSongsSection && isShowingHiddenTracks
    ? MAIN_MENU_ALL_SONGS_HIDDEN_TITLE
    : isPlaylistsSection && playlistsSubSection === 'add-songs'
      ? PLAYLISTS_ADD_SONGS_TITLE
      : isPlaylistsSection && playlistsSubSection === 'remove-songs'
        ? PLAYLISTS_REMOVE_SONGS_TITLE
        : isPlaylistsSection && playlistsSubSection === 'detail' && selectedPlaylist
        ? selectedPlaylist.name.toUpperCase()
        : isSettingsSection &&
            settingsSubSection === 'customization' &&
            customizationSubSection !== 'root'
          ? CUSTOMIZATION_SUBSECTION_TITLES[customizationSubSection]
          : isSettingsSection &&
              settingsSubSection === 'audio-quality' &&
              audioQualitySubSection !== 'root'
            ? AUDIO_QUALITY_SUBSECTION_TITLES[audioQualitySubSection]
            : isSettingsSection
              ? SETTINGS_SUBSECTION_TITLES[settingsSubSection]
              : MAIN_MENU_SECTION_TITLES[mainMenuSection]

  const handleToggleAllSongsOptions = useCallback((): void => {
    setIsAllSongsOptionsOpen((isOpen) => !isOpen)
  }, [])

  const handleCloseAllSongsOptions = useCallback((): void => {
    setIsAllSongsOptionsOpen(false)
  }, [])

  const handleToggleFontsOptions = useCallback((): void => {
    setIsFontsOptionsOpen((isOpen) => !isOpen)
  }, [])

  const handleCloseFontsOptions = useCallback((): void => {
    setIsFontsOptionsOpen(false)
  }, [])

  const handleToggleAudioQualityOptions = useCallback((): void => {
    setIsAudioQualityOptionsOpen((isOpen) => !isOpen)
  }, [])

  const handleCloseAudioQualityOptions = useCallback((): void => {
    setIsAudioQualityOptionsOpen(false)
  }, [])

  const handleToggleHiddenTracksView = useCallback((): void => {
    toggleHiddenTracksView()
  }, [toggleHiddenTracksView])

  const handleBackdropClick = useCallback((): void => {
    closeMainMenu()
  }, [closeMainMenu])

  const allSongsOptionsOpen = isAllSongsSection && isAllSongsOptionsOpen

  const handleGoBackMainMenu = useCallback((): void => {
    if (isAllSongsSection) {
      setIsAllSongsOptionsOpen(false)
    }

    if (isFontsCustomizationSection) {
      setIsFontsOptionsOpen(false)
    }

    if (isAudioQualityRootSection) {
      setIsAudioQualityOptionsOpen(false)
    }

    goBackMainMenu()
  }, [goBackMainMenu, isAllSongsSection, isAudioQualityRootSection, isFontsCustomizationSection])

  const handleOpenMainMenuSection = useCallback(
    (destination: MainMenuDestination): void => {
      setIsAllSongsOptionsOpen(false)
      setIsFontsOptionsOpen(false)
      setIsAudioQualityOptionsOpen(false)
      openMainMenuSection(destination)
    },
    [openMainMenuSection],
  )
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return
      }

      if (isRootSection) {
        closeMainMenu()
        return
      }

      handleGoBackMainMenu()
    },
    [closeMainMenu, handleGoBackMainMenu, isRootSection],
  )

  useEffect(() => {
    if (isFontsCustomizationSection) {
      return
    }

    setIsFontsOptionsOpen(false)
  }, [isFontsCustomizationSection])

  useEffect(() => {
    if (isAudioQualityRootSection) {
      return
    }

    setIsAudioQualityOptionsOpen(false)
  }, [isAudioQualityRootSection])

  useEffect(() => {
    if (isAllSongsSection) {
      return
    }

    resetHiddenTracksView()
  }, [isAllSongsSection, resetHiddenTracksView])

  useEffect(() => {
    if (isSettingsSection) {
      return
    }

    resetSettingsSubSection()
    resetCustomizationSubSection()
    resetAudioQualitySubSection()
  }, [isSettingsSection, resetAudioQualitySubSection, resetCustomizationSubSection, resetSettingsSubSection])

  useEffect(() => {
    if (isPlaylistsSection) {
      return
    }

    resetPlaylistsSubSection()
  }, [isPlaylistsSection, resetPlaylistsSubSection])

  useEffect(() => {
    if (!isMounted) {
      return
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isMounted])

  if (!isMounted) {
    return null
  }

  return (
    <div
      className="push-screen push-screen--from-left fixed inset-0 z-[60] overflow-hidden"
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        aria-label="Cerrar menú principal"
        onClick={handleBackdropClick}
        className={`push-screen__backdrop absolute inset-0 ${
          isVisible ? 'push-screen__backdrop--visible' : ''
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="main-menu-title"
        className={`push-screen__panel pointer-events-none absolute ${
          isVisible ? 'push-screen__panel--visible' : ''
        }`}
      >
        <div className="push-screen__content pointer-events-auto flex h-full min-h-[100dvh] w-full flex-col overflow-hidden">
          <div className="push-screen__layout main-menu-screen__layout">
            <header className="main-menu-screen__header shrink-0">
              {isAllSongsSection && !isShowingHiddenTracks ? (
                <MainMenuAllSongsOptionsMenu
                  isOpen={allSongsOptionsOpen}
                  isShowingHiddenTracks={isShowingHiddenTracks}
                  onToggle={handleToggleAllSongsOptions}
                  onClose={handleCloseAllSongsOptions}
                  onToggleHiddenTracksView={handleToggleHiddenTracksView}
                />
              ) : null}

              {isFontsCustomizationSection ? (
                <MainMenuCustomizationFontsOptionsMenu
                  isOpen={isFontsOptionsOpen}
                  onToggle={handleToggleFontsOptions}
                  onClose={handleCloseFontsOptions}
                />
              ) : null}

              {isAudioQualityRootSection ? (
                <MainMenuAudioQualityOptionsMenu
                  isOpen={isAudioQualityOptionsOpen}
                  onToggle={handleToggleAudioQualityOptions}
                  onClose={handleCloseAudioQualityOptions}
                />
              ) : null}

              <h1
                id="main-menu-title"
                className="push-screen__title bebas-neue-regular tracking-wide text-[var(--player-play-button)]"
              >
                {sectionTitle}
              </h1>
            </header>

            {isRootSection ? (
              <>
                <nav className="main-menu-screen__nav" aria-label="Opciones del menú principal">
                  {MAIN_MENU_OPTIONS.map((option) => {
                    const Icon = MAIN_MENU_ICONS[option.id]

                    return (
                      <MainMenuNavItem
                        key={option.id}
                        label={option.label}
                        icon={<Icon size={20} />}
                        onClick={() => handleOpenMainMenuSection(option.id)}
                      />
                    )
                  })}
                </nav>

                <MainMenuBrandFooter />
              </>
            ) : null}

            {!isRootSection ? (
              <div className="main-menu-screen__section min-h-0 flex-1 overflow-hidden">
                {mainMenuSection === 'all-songs' ? (
                  <MainMenuAllSongsSection isShowingHiddenTracks={isShowingHiddenTracks} />
                ) : null}

                {mainMenuSection === 'playlists' ? <MainMenuPlaylistsSection /> : null}

                {mainMenuSection === 'favorites' ? <MainMenuFavoritesSection /> : null}

                {mainMenuSection === 'settings' ? <MainMenuSettingsSection /> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
