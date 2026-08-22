/** Shell de lista de pistas del menú principal con búsqueda opcional. */

import { useCallback, useMemo, useState, type ReactNode } from 'react'

import {
  filterTracksBySearchQuery,
  MusicLibrary,
  useLocalMusicLibrary,
  type Track,
} from '@features/musicPlayer'
import { MAIN_MENU_SEARCH_EMPTY_MESSAGE } from '../../lib/mainMenuConstants'
import { MainMenuAllSongsSearchBar } from './MainMenuAllSongsSearchBar'

const TRACK_LIST_LIBRARY_CLASS_NAME = 'min-h-0 flex-1 p-0'
const TRACK_LIST_SCROLL_CLASS_NAME = 'main-menu-screen__scroll'

interface MainMenuTrackListSearchState {
  searchQuery: string
  handleSearchQueryChange: (value: string) => void
  displayedTracks: Track[]
  resolvedEmptyMessage: string
}

interface MainMenuTrackListAppearance {
  onTrackAction?: (track: Track) => void
  trackActionLabel?: string
  showNavDots?: boolean
  showTrackIndex?: boolean
  showTrackDuration?: boolean
  isShowingHiddenTracks?: boolean
}

interface MainMenuTrackListShellProps extends MainMenuTrackListAppearance {
  tracks: Track[]
  emptyMessage: string
  search?: boolean
  ariaLabel: string
  className: string
  header?: ReactNode
  children?: ReactNode
}

interface MainMenuEmbeddedLibraryProps extends MainMenuTrackListAppearance {
  tracks: Track[]
  emptyMessage: string
}

/**
 * Filtra la lista cuando hay búsqueda y elige el mensaje vacío correspondiente.
 */
function useMainMenuTrackListSearch(
  tracks: Track[],
  emptyMessage: string,
  searchEnabled: boolean,
): MainMenuTrackListSearchState {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchQueryChange = useCallback((value: string): void => {
    setSearchQuery(value)
  }, [])

  const displayedTracks = useMemo(() => {
    if (!searchEnabled) {
      return tracks
    }

    return filterTracksBySearchQuery(tracks, searchQuery)
  }, [searchEnabled, searchQuery, tracks])

  const resolvedEmptyMessage =
    searchEnabled && searchQuery.trim().length > 0
      ? MAIN_MENU_SEARCH_EMPTY_MESSAGE
      : emptyMessage

  return {
    searchQuery,
    handleSearchQueryChange,
    displayedTracks,
    resolvedEmptyMessage,
  }
}

/**
 * Biblioteca embebida del menú: mismas props visuales en todas las secciones.
 */
function MainMenuEmbeddedLibrary({
  tracks,
  emptyMessage,
  onTrackAction,
  trackActionLabel,
  showNavDots = false,
  showTrackIndex = false,
  showTrackDuration = false,
  isShowingHiddenTracks = false,
}: MainMenuEmbeddedLibraryProps) {
  const { status, errorMessage } = useLocalMusicLibrary()

  return (
    <MusicLibrary
      className={TRACK_LIST_LIBRARY_CLASS_NAME}
      status={status}
      errorMessage={errorMessage}
      showHeader={false}
      showTrackCovers
      showNavDots={showNavDots}
      showTrackIndex={showTrackIndex}
      showTrackDuration={showTrackDuration}
      isShowingHiddenTracks={isShowingHiddenTracks}
      tracks={tracks}
      emptyMessage={emptyMessage}
      scrollClassName={TRACK_LIST_SCROLL_CLASS_NAME}
      onTrackClick={onTrackAction}
      trackClickLabel={trackActionLabel}
    />
  )
}

/**
 * Envuelve la biblioteca del menú: búsqueda opcional, lista y acción por pista.
 */
export function MainMenuTrackListShell({
  tracks,
  emptyMessage,
  search = false,
  ariaLabel,
  className,
  header,
  children,
  ...libraryAppearance
}: MainMenuTrackListShellProps) {
  const { searchQuery, handleSearchQueryChange, displayedTracks, resolvedEmptyMessage } =
    useMainMenuTrackListSearch(tracks, emptyMessage, search)

  return (
    <section className={className} aria-label={ariaLabel}>
      {header}

      {search ? (
        <MainMenuAllSongsSearchBar value={searchQuery} onChange={handleSearchQueryChange} />
      ) : null}

      <MainMenuEmbeddedLibrary
        tracks={displayedTracks}
        emptyMessage={resolvedEmptyMessage}
        {...libraryAppearance}
      />

      {children}
    </section>
  )
}
