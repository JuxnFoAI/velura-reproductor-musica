/** Tests de navegación de cola: siguiente, anterior, repeat y shuffle. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlayerState, RepeatMode, Track } from '../types'
import {
  consumePreviousTrack,
  getNextTrack,
  getNextTrackAfterFailure,
  pushTrackHistory,
  resetTrackHistory,
} from './playerQueueLogic'

function createTrack(id: string): Track {
  return {
    id,
    title: id,
    artist: 'Artista',
    duration: 180,
    src: `velura-media://${id}.mp3`,
  }
}

function createPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
  const queue = overrides.queue ?? [createTrack('a'), createTrack('b'), createTrack('c')]

  return {
    currentTrack: queue[0] ?? null,
    queue,
    libraryQueue: queue,
    queueContext: 'library',
    status: 'paused',
    volume: 1,
    isMuted: false,
    currentTime: 0,
    duration: 180,
    repeatMode: 'none',
    isShuffle: false,
    isAudioBlocked: false,
    isLyricsVisible: false,
    favoriteTrackIds: [],
    hiddenTrackIds: [],
    ...overrides,
  }
}

function playerWithRepeat(repeatMode: RepeatMode, currentTrackId: string): PlayerState {
  const queue = [createTrack('a'), createTrack('b'), createTrack('c')]
  const currentTrack = queue.find((track) => track.id === currentTrackId) ?? queue[0]

  return createPlayerState({ queue, currentTrack, repeatMode })
}

describe('getNextTrack', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('devuelve la siguiente pista en orden', () => {
    const state = playerWithRepeat('none', 'a')

    expect(getNextTrack(state)?.id).toBe('b')
  })

  it('devuelve null al final de la cola sin repeat ni wrap', () => {
    const state = playerWithRepeat('none', 'c')

    expect(getNextTrack(state)).toBeNull()
  })

  it('vuelve a la primera pista con repeat all', () => {
    const state = playerWithRepeat('all', 'c')

    expect(getNextTrack(state)?.id).toBe('a')
  })

  it('vuelve a la primera pista con wrapQueue aunque repeat sea none', () => {
    const state = playerWithRepeat('none', 'c')

    expect(getNextTrack(state, { wrapQueue: true })?.id).toBe('a')
  })

  it('repite la pista actual con repeat one', () => {
    const state = playerWithRepeat('one', 'b')

    expect(getNextTrack(state)?.id).toBe('b')
  })

  it('elige otra pista al azar en shuffle y evita la actual', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const state = createPlayerState({ isShuffle: true, currentTrack: createTrack('a') })

    expect(getNextTrack(state)?.id).toBe('b')
  })

  it('en shuffle con una sola pista solo continúa si repeat es all', () => {
    const singleTrack = createTrack('solo')
    const noneState = createPlayerState({
      queue: [singleTrack],
      currentTrack: singleTrack,
      isShuffle: true,
      repeatMode: 'none',
    })
    const allState = { ...noneState, repeatMode: 'all' as const }

    expect(getNextTrack(noneState)).toBeNull()
    expect(getNextTrack(allState)?.id).toBe('solo')
  })

  it('usa la primera pista si hay cola pero ninguna activa', () => {
    const state = createPlayerState({ currentTrack: null })

    expect(getNextTrack(state)?.id).toBe('a')
  })
})

describe('consumePreviousTrack', () => {
  beforeEach(() => {
    resetTrackHistory()
  })

  it('retrocede en el historial real de reproducción', () => {
    pushTrackHistory('a')
    pushTrackHistory('b')
    pushTrackHistory('c')

    const firstPrevious = consumePreviousTrack(playerWithRepeat('none', 'c'))
    const secondPrevious = consumePreviousTrack(playerWithRepeat('none', 'b'))

    expect(firstPrevious?.id).toBe('b')
    expect(secondPrevious?.id).toBe('a')
  })

  it('ignora ids del historial que ya no están en la cola', () => {
    pushTrackHistory('a')
    pushTrackHistory('fuera')
    pushTrackHistory('b')

    const previousTrack = consumePreviousTrack(playerWithRepeat('none', 'b'))

    expect(previousTrack?.id).toBe('a')
  })

  it('sin historial, usa la pista anterior de la cola', () => {
    const previousTrack = consumePreviousTrack(playerWithRepeat('none', 'b'))

    expect(previousTrack?.id).toBe('a')
  })

  it('sin historial, en la primera pista con repeat all va a la última', () => {
    const previousTrack = consumePreviousTrack(playerWithRepeat('all', 'a'))

    expect(previousTrack?.id).toBe('c')
  })

  it('sin historial, en la primera pista con repeat none no retrocede', () => {
    expect(consumePreviousTrack(playerWithRepeat('none', 'a'))).toBeNull()
  })
})

describe('getNextTrackAfterFailure', () => {
  it('salta a la pista siguiente a la que falló', () => {
    const state = playerWithRepeat('none', 'a')

    expect(getNextTrackAfterFailure(state, 'a')?.id).toBe('b')
  })

  it('con repeat all envuelve a otra pista distinta a la que falló', () => {
    const state = playerWithRepeat('all', 'c')

    expect(getNextTrackAfterFailure(state, 'c')?.id).toBe('a')
  })

  it('devuelve null si la pista que falló no está en la cola', () => {
    const state = playerWithRepeat('all', 'a')

    expect(getNextTrackAfterFailure(state, 'inexistente')).toBeNull()
  })
})
