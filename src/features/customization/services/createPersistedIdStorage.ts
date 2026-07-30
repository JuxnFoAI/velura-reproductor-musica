/** Factory genérica para persistir identificadores validados en localStorage. */

interface PersistedIdStorageConfig<T extends string> {
  storageKey: string
  defaultId: T
  fieldName: string
  isValidId: (value: unknown) => value is T
}

interface PersistedIdStorage<T extends string> {
  load: () => T
  save: (id: T) => void
}

/**
 * Crea funciones load/save con validación y valores por defecto seguros.
 */
export function createPersistedIdStorage<T extends string>({
  storageKey,
  defaultId,
  fieldName,
  isValidId,
}: PersistedIdStorageConfig<T>): PersistedIdStorage<T> {
  const load = (): T => {
    try {
      const raw = localStorage.getItem(storageKey)

      if (!raw) {
        return defaultId
      }

      const parsed: unknown = JSON.parse(raw)

      if (typeof parsed !== 'object' || parsed === null) {
        return defaultId
      }

      const storedId = (parsed as Record<string, unknown>)[fieldName]

      if (isValidId(storedId)) {
        return storedId
      }

      return defaultId
    } catch {
      return defaultId
    }
  }

  const save = (id: T): void => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ [fieldName]: id }))
    } catch {
      // Ignorar errores de cuota o modo privado.
    }
  }

  return { load, save }
}
