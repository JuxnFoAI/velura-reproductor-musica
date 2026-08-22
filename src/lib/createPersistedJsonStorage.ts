/** Factory genérica para persistir JSON validado en localStorage. */

export type PersistedJsonValidator<T> = (value: unknown) => T | null

export interface PersistedJsonStorage<T> {
  load: () => T
  save: (value: T) => void
  clear: () => void
}

/**
 * Distingue un valor parseado como objeto JSON (incluye arrays) de primitivos y null.
 */
export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readDefaultValue<T>(defaultValue: T): T {
  return structuredClone(defaultValue)
}

function ignoreQuotaErrors(write: () => void): void {
  try {
    write()
  } catch {
    // Ignorar errores de cuota o modo privado.
  }
}

/**
 * Crea load/save/clear con parseo, validación y valor por defecto seguro.
 */
export function createPersistedJsonStorage<T>(
  storageKey: string,
  defaultValue: T,
  validate: PersistedJsonValidator<T>,
): PersistedJsonStorage<T> {
  const load = (): T => {
    try {
      const raw = localStorage.getItem(storageKey)

      if (!raw) {
        return readDefaultValue(defaultValue)
      }

      const parsed: unknown = JSON.parse(raw)
      const validated = validate(parsed)

      return validated === null ? readDefaultValue(defaultValue) : validated
    } catch {
      return readDefaultValue(defaultValue)
    }
  }

  const save = (value: T): void => {
    ignoreQuotaErrors(() => {
      localStorage.setItem(storageKey, JSON.stringify(value))
    })
  }

  const clear = (): void => {
    ignoreQuotaErrors(() => {
      localStorage.removeItem(storageKey)
    })
  }

  return { load, save, clear }
}
