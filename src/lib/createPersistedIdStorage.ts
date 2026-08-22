/** Factory para persistir un identificador validado dentro de un objeto JSON. */

import { createPersistedJsonStorage, isJsonObject } from './createPersistedJsonStorage'

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

function readStoredId<T extends string>(
  payload: Record<string, T>,
  fieldName: string,
  isValidId: (value: unknown) => value is T,
  defaultId: T,
): T {
  const storedId = payload[fieldName]
  return isValidId(storedId) ? storedId : defaultId
}

/**
 * Crea load/save para un id serializado como `{ [fieldName]: id }`.
 */
export function createPersistedIdStorage<T extends string>({
  storageKey,
  defaultId,
  fieldName,
  isValidId,
}: PersistedIdStorageConfig<T>): PersistedIdStorage<T> {
  const storage = createPersistedJsonStorage<Record<string, T>>(
    storageKey,
    { [fieldName]: defaultId },
    (value) => {
      if (!isJsonObject(value)) {
        return null
      }

      const storedId = value[fieldName]
      return isValidId(storedId) ? { [fieldName]: storedId } : null
    },
  )

  return {
    load: () => readStoredId(storage.load(), fieldName, isValidId, defaultId),
    save: (id) => storage.save({ [fieldName]: id }),
  }
}
