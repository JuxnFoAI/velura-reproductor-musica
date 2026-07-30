/** Tipos y catálogo de colores personalizables de la Isla dinámica. */

export type DynamicIslandColorId =
  | 'default'
  | 'slate'
  | 'navy'
  | 'purple'
  | 'teal'
  | 'wine'

export interface DynamicIslandColorOption {
  id: DynamicIslandColorId
  label: string
  swatch: string
  background: string
}

export const DEFAULT_DYNAMIC_ISLAND_COLOR_ID: DynamicIslandColorId = 'default'

export const DYNAMIC_ISLAND_COLOR_OPTIONS: readonly DynamicIslandColorOption[] = [
  { id: 'default', label: 'Predeterminado', swatch: '#000000', background: '#000000' },
  { id: 'slate', label: 'Pizarra', swatch: '#1e293b', background: '#1e293b' },
  { id: 'navy', label: 'Azul marino', swatch: '#172554', background: '#172554' },
  { id: 'purple', label: 'Morado', swatch: '#2e1065', background: '#2e1065' },
  { id: 'teal', label: 'Verde azulado', swatch: '#134e4a', background: '#134e4a' },
  { id: 'wine', label: 'Vino', swatch: '#4c0519', background: '#4c0519' },
] as const

export function getDynamicIslandColorById(
  colorId: DynamicIslandColorId,
): DynamicIslandColorOption | undefined {
  return DYNAMIC_ISLAND_COLOR_OPTIONS.find((option) => option.id === colorId)
}

export function isDynamicIslandColorId(value: unknown): value is DynamicIslandColorId {
  return (
    typeof value === 'string' &&
    DYNAMIC_ISLAND_COLOR_OPTIONS.some((option) => option.id === value)
  )
}
