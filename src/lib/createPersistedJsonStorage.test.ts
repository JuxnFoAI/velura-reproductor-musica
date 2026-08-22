/** Tests de persistencia JSON genérica y de identificadores envueltos. */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createPersistedIdStorage } from './createPersistedIdStorage'
import { createPersistedJsonStorage, isJsonObject } from './createPersistedJsonStorage'

interface SampleSettings {
  volume: number
}

const STORAGE_KEY = 'test-persisted-json'
const DEFAULT_SETTINGS: SampleSettings = { volume: 0.5 }

function isSampleSettings(value: unknown): SampleSettings | null {
  if (!isJsonObject(value) || typeof value.volume !== 'number') {
    return null
  }

  return { volume: value.volume }
}

function installMemoryLocalStorage(): Map<string, string> {
  const store = new Map<string, string>()

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string): string | null => store.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        store.set(key, value)
      },
      removeItem: (key: string): void => {
        store.delete(key)
      },
    },
  })

  return store
}

describe('createPersistedJsonStorage', () => {
  beforeEach(() => {
    installMemoryLocalStorage()
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('devuelve una copia del valor por defecto si la clave no existe', () => {
    const storage = createPersistedJsonStorage(STORAGE_KEY, DEFAULT_SETTINGS, isSampleSettings)
    const loaded = storage.load()

    loaded.volume = 1

    expect(storage.load()).toEqual(DEFAULT_SETTINGS)
  })

  it('devuelve el valor por defecto si el JSON es inválido', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')
    const storage = createPersistedJsonStorage(STORAGE_KEY, DEFAULT_SETTINGS, isSampleSettings)

    expect(storage.load()).toEqual(DEFAULT_SETTINGS)
  })

  it('devuelve el valor por defecto si validate rechaza el payload', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: 'loud' }))
    const storage = createPersistedJsonStorage(STORAGE_KEY, DEFAULT_SETTINGS, isSampleSettings)

    expect(storage.load()).toEqual(DEFAULT_SETTINGS)
  })

  it('carga el valor validado y roundtrippea save', () => {
    const storage = createPersistedJsonStorage(STORAGE_KEY, DEFAULT_SETTINGS, isSampleSettings)
    storage.save({ volume: 0.8 })

    expect(storage.load()).toEqual({ volume: 0.8 })
  })

  it('elimina la clave con clear', () => {
    const storage = createPersistedJsonStorage(STORAGE_KEY, DEFAULT_SETTINGS, isSampleSettings)
    storage.save({ volume: 0.2 })
    storage.clear()

    expect(storage.load()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('createPersistedIdStorage', () => {
  beforeEach(() => {
    installMemoryLocalStorage()
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('guarda y lee el id dentro de { fieldName }', () => {
    const isThemeId = (value: unknown): value is 'dark' | 'light' =>
      value === 'dark' || value === 'light'
    const storage = createPersistedIdStorage({
      storageKey: 'test-id',
      defaultId: 'light',
      fieldName: 'themeId',
      isValidId: isThemeId,
    })

    storage.save('dark')

    expect(JSON.parse(localStorage.getItem('test-id') ?? '')).toEqual({ themeId: 'dark' })
    expect(storage.load()).toBe('dark')
  })

  it('vuelve al id por defecto si el campo no es válido', () => {
    localStorage.setItem('test-id', JSON.stringify({ themeId: 'neon' }))
    const isThemeId = (value: unknown): value is 'dark' | 'light' =>
      value === 'dark' || value === 'light'
    const storage = createPersistedIdStorage({
      storageKey: 'test-id',
      defaultId: 'light',
      fieldName: 'themeId',
      isValidId: isThemeId,
    })

    expect(storage.load()).toBe('light')
  })
})
