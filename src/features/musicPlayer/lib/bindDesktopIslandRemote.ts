/** Enlaza el store local de la isla flotante con el reproductor de la ventana principal. */

import type { DesktopIslandCommand } from '@shared/desktop'
import { applyDesktopIslandSnapshot } from '../store/applyDesktopIslandSnapshot'
import { playerStore } from '../store/playerStore'
import { syncDesktopIslandWindowShape } from './syncDesktopIslandWindowShape'

function sendIslandCommand(command: DesktopIslandCommand): void {
  void window.veluraDesktopIsland?.sendCommand(command)
}

function bindOverlayTransportActions(): void {
  playerStore.setState({
    play: () => sendIslandCommand({ type: 'play' }),
    pause: () => sendIslandCommand({ type: 'pause' }),
    next: () => sendIslandCommand({ type: 'next' }),
    previous: () => sendIslandCommand({ type: 'previous' }),
    seek: (time) => sendIslandCommand({ type: 'seek', time }),
    setVolume: (volume) => sendIslandCommand({ type: 'setVolume', volume }),
    toggleMute: () => sendIslandCommand({ type: 'toggleMute' }),
    toggleShuffle: () => sendIslandCommand({ type: 'toggleShuffle' }),
    setRepeatMode: (mode) => sendIslandCommand({ type: 'setRepeatMode', mode }),
  })
}

const INTERACTIVE_SELECTOR = '.dynamic-island, .dynamic-island__handle'

function isPointerOverIsland(clientX: number, clientY: number): boolean {
  const hoveredElement = document.elementFromPoint(clientX, clientY)

  return hoveredElement instanceof Element && hoveredElement.closest(INTERACTIVE_SELECTOR) !== null
}

function bindOverlayClickThrough(): () => void {
  let isIgnoringMouse = true
  let isPointerDown = false

  const syncIgnoreMouse = (clientX: number, clientY: number): void => {
    const shouldIgnore = !isPointerDown && !isPointerOverIsland(clientX, clientY)

    if (shouldIgnore === isIgnoringMouse) {
      return
    }

    isIgnoringMouse = shouldIgnore
    void window.veluraDesktopIsland?.setIgnoreMouseEvents(shouldIgnore)
  }

  const handleMouseMove = (event: MouseEvent): void => {
    syncIgnoreMouse(event.clientX, event.clientY)
  }

  const handlePointerDown = (): void => {
    isPointerDown = true
    isIgnoringMouse = false
    void window.veluraDesktopIsland?.setIgnoreMouseEvents(false)
  }

  const handlePointerUp = (event: PointerEvent): void => {
    isPointerDown = false
    syncIgnoreMouse(event.clientX, event.clientY)
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('pointerdown', handlePointerDown)
  window.addEventListener('pointerup', handlePointerUp)

  return () => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('pointerdown', handlePointerDown)
    window.removeEventListener('pointerup', handlePointerUp)
  }
}

/** Configura el renderer de la isla flotante como control remoto del reproductor. */
export function bindDesktopIslandRemote(): () => void {
  bindOverlayTransportActions()

  const unsubscribeState = window.veluraDesktopIsland?.onState((snapshot) => {
    applyDesktopIslandSnapshot(snapshot)
  })
  const unbindClickThrough = bindOverlayClickThrough()
  const unbindWindowShape = syncDesktopIslandWindowShape()

  window.veluraDesktopIsland?.requestState()

  return () => {
    unsubscribeState?.()
    unbindClickThrough()
    unbindWindowShape()
  }
}
