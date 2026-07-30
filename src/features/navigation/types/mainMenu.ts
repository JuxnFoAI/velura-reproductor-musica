/** Secciones disponibles dentro del menú principal push. */

export type MainMenuSection = 'root' | 'all-songs' | 'playlists' | 'favorites' | 'settings'

export type MainMenuDestination = Exclude<MainMenuSection, 'root'>

export interface MainMenuNavOption {
  id: MainMenuDestination
  label: string
}

export const MAIN_MENU_OPTIONS: readonly MainMenuNavOption[] = [
  { id: 'all-songs', label: 'Todas las canciones' },
  { id: 'playlists', label: 'Listas de reproducción' },
  { id: 'favorites', label: 'Favoritos' },
  { id: 'settings', label: 'Ajustes' },
] as const

export const MAIN_MENU_SECTION_TITLES: Record<MainMenuSection, string> = {
  root: 'MENÚ PRINCIPAL',
  'all-songs': 'TODAS LAS CANCIONES',
  playlists: 'LISTAS DE REPRODUCCIÓN',
  favorites: 'FAVORITOS',
  settings: 'AJUSTES',
}

export const MAIN_MENU_ALL_SONGS_HIDDEN_TITLE = 'CANCIONES OCULTAS'
