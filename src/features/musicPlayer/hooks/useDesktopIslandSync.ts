/** Publica el estado del reproductor hacia la isla flotante del escritorio. */

import { useEffect } from 'react'
import { useCustomizationStore } from '@features/customization'
import { isDesktopIslandWindow } from '@lib/desktopIslandWindow'
import { isDesktopApp } from '@lib/runtimeEnvironment'
import type { DesktopIslandCommand } from '@shared/desktop'
import { playerStore } from '../store/playerStore'
import { buildDesktopIslandSnapshot } from '../store/buildDesktopIslandSnapshot'

const PUBLISH_THROTTLE_MS = 100

function dispatchIslandCommand(command: DesktopIslandCommand): void {
  const player = playerStore.getState()

  switch (command.type) {
    case 'play':
      player.play()
      return
    case 'pause':
      player.pause()
      return
    case 'next':
      player.next({ wrapQueue: true })
      return
    case 'previous':
      player.previous()
      return
    case 'seek':
      player.seek(command.time)
      return
    case 'setVolume':
      player.setVolume(command.volume)
      return
    case 'toggleMute':
      player.toggleMute()
      return
    case 'toggleShuffle':
      player.toggleShuffle()
      return
    case 'setRepeatMode':
      player.setRepeatMode(command.mode)
      return
  }
}

function publishIslandState(): void {
  window.veluraDesktopIsland?.publishState(buildDesktopIslandSnapshot())
}

/**
 * Sincroniza la ventana principal con la isla flotante: estado saliente y comandos entrantes.
 */
export function useDesktopIslandSync(): void {
  useEffect(() => {
    if (!isDesktopApp() || isDesktopIslandWindow() || !window.veluraDesktopIsland) {
      return undefined
    }

    let throttleTimeoutId: number | null = null

    const publishSoon = (): void => {
      if (throttleTimeoutId !== null) {
        return
      }

      throttleTimeoutId = window.setTimeout(() => {
        throttleTimeoutId = null
        publishIslandState()
      }, PUBLISH_THROTTLE_MS)
    }

    const unsubscribePlayer = playerStore.subscribe(publishSoon)
    const unsubscribeCustomization = useCustomizationStore.subscribe(publishSoon)
    const unsubscribeCommands = window.veluraDesktopIsland.onCommand(dispatchIslandCommand)

    publishIslandState()

    return () => {
      unsubscribePlayer()
      unsubscribeCustomization()
      unsubscribeCommands()

      if (throttleTimeoutId !== null) {
        window.clearTimeout(throttleTimeoutId)
      }
    }
  }, [])
}
