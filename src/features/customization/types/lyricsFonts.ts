/** Tipos y catálogo de fuentes disponibles para el modo letra. */

export type LyricsFontCategory = 'standard' | 'cursive'

export type LyricsFontId =
  | 'montserrat'
  | 'inter'
  | 'lato'
  | 'nunito'
  | 'poppins'
  | 'dm-sans'
  | 'source-sans-3'
  | 'work-sans'
  | 'lora'
  | 'merriweather'
  | 'caveat'
  | 'dancing-script'
  | 'pacifico'
  | 'satisfy'
  | 'sacramento'
  | 'marck-script'
  | 'handlee'
  | 'alex-brush'
  | 'parisienne'
  | 'great-vibes'

export interface LyricsFontOption {
  id: LyricsFontId
  label: string
  fontFamily: string
  googleFontsQuery: string
  category: LyricsFontCategory
  isPreloaded?: boolean
}

export const DEFAULT_LYRICS_FONT_ID: LyricsFontId = 'montserrat'

export const LYRICS_FONT_CATEGORY_LABELS: Record<LyricsFontCategory, string> = {
  standard: 'Clásicas',
  cursive: 'Cursivas',
}

export const LYRICS_FONT_CATEGORY_ORDER: readonly LyricsFontCategory[] = [
  'standard',
  'cursive',
] as const

export const LYRICS_FONT_OPTIONS: readonly LyricsFontOption[] = [
  {
    id: 'montserrat',
    label: 'Montserrat',
    fontFamily: "'Montserrat', sans-serif",
    googleFontsQuery: 'Montserrat:wght@400;500;600',
    category: 'standard',
    isPreloaded: true,
  },
  {
    id: 'inter',
    label: 'Inter',
    fontFamily: "'Inter', sans-serif",
    googleFontsQuery: 'Inter:wght@400;500;600',
    category: 'standard',
  },
  {
    id: 'lato',
    label: 'Lato',
    fontFamily: "'Lato', sans-serif",
    googleFontsQuery: 'Lato:wght@400;700',
    category: 'standard',
  },
  {
    id: 'nunito',
    label: 'Nunito',
    fontFamily: "'Nunito', sans-serif",
    googleFontsQuery: 'Nunito:wght@400;500;600',
    category: 'standard',
  },
  {
    id: 'poppins',
    label: 'Poppins',
    fontFamily: "'Poppins', sans-serif",
    googleFontsQuery: 'Poppins:wght@400;500;600',
    category: 'standard',
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    fontFamily: "'DM Sans', sans-serif",
    googleFontsQuery: 'DM+Sans:wght@400;500;600',
    category: 'standard',
  },
  {
    id: 'source-sans-3',
    label: 'Source Sans 3',
    fontFamily: "'Source Sans 3', sans-serif",
    googleFontsQuery: 'Source+Sans+3:wght@400;500;600',
    category: 'standard',
  },
  {
    id: 'work-sans',
    label: 'Work Sans',
    fontFamily: "'Work Sans', sans-serif",
    googleFontsQuery: 'Work+Sans:wght@400;500;600',
    category: 'standard',
  },
  {
    id: 'lora',
    label: 'Lora',
    fontFamily: "'Lora', serif",
    googleFontsQuery: 'Lora:wght@400;500;600',
    category: 'standard',
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    fontFamily: "'Merriweather', serif",
    googleFontsQuery: 'Merriweather:wght@400;700',
    category: 'standard',
  },
  {
    id: 'caveat',
    label: 'Caveat',
    fontFamily: "'Caveat', cursive",
    googleFontsQuery: 'Caveat:wght@400;500;600',
    category: 'cursive',
  },
  {
    id: 'dancing-script',
    label: 'Dancing Script',
    fontFamily: "'Dancing Script', cursive",
    googleFontsQuery: 'Dancing+Script:wght@400;500;600;700',
    category: 'cursive',
  },
  {
    id: 'pacifico',
    label: 'Pacifico',
    fontFamily: "'Pacifico', cursive",
    googleFontsQuery: 'Pacifico',
    category: 'cursive',
  },
  {
    id: 'satisfy',
    label: 'Satisfy',
    fontFamily: "'Satisfy', cursive",
    googleFontsQuery: 'Satisfy',
    category: 'cursive',
  },
  {
    id: 'sacramento',
    label: 'Sacramento',
    fontFamily: "'Sacramento', cursive",
    googleFontsQuery: 'Sacramento',
    category: 'cursive',
  },
  {
    id: 'marck-script',
    label: 'Marck Script',
    fontFamily: "'Marck Script', cursive",
    googleFontsQuery: 'Marck+Script',
    category: 'cursive',
  },
  {
    id: 'handlee',
    label: 'Handlee',
    fontFamily: "'Handlee', cursive",
    googleFontsQuery: 'Handlee',
    category: 'cursive',
  },
  {
    id: 'alex-brush',
    label: 'Alex Brush',
    fontFamily: "'Alex Brush', cursive",
    googleFontsQuery: 'Alex+Brush',
    category: 'cursive',
  },
  {
    id: 'parisienne',
    label: 'Parisienne',
    fontFamily: "'Parisienne', cursive",
    googleFontsQuery: 'Parisienne',
    category: 'cursive',
  },
  {
    id: 'great-vibes',
    label: 'Great Vibes',
    fontFamily: "'Great Vibes', cursive",
    googleFontsQuery: 'Great+Vibes',
    category: 'cursive',
  },
] as const

export const LYRICS_FONT_PREVIEW_LINES = [
  { text: 'Línea anterior de ejemplo', variant: 'past' },
  { text: 'Esta es la línea activa', variant: 'active' },
  { text: 'Siguiente línea de ejemplo', variant: 'next' },
] as const

/**
 * Agrupa las fuentes disponibles por categoría visual.
 */
export function getLyricsFontsByCategory(
  category: LyricsFontCategory,
): readonly LyricsFontOption[] {
  return LYRICS_FONT_OPTIONS.filter((option) => option.category === category)
}

/**
 * Obtiene una fuente del catálogo por identificador.
 */
export function getLyricsFontById(fontId: LyricsFontId): LyricsFontOption | undefined {
  return LYRICS_FONT_OPTIONS.find((option) => option.id === fontId)
}

/**
 * Comprueba si un valor es un identificador de fuente válido.
 */
export function isLyricsFontId(value: unknown): value is LyricsFontId {
  return (
    typeof value === 'string' &&
    LYRICS_FONT_OPTIONS.some((option) => option.id === value)
  )
}
