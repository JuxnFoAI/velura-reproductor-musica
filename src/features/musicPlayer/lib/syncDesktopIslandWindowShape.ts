/** Recorta la ventana overlay a la silueta de la isla sin recortar la animación. */

import {
  clampRectToWindow,
  inflateRect,
  isPositiveRect,
  readPredictedSettledRect,
  readVisibleStackRect,
  toRectKey,
  unionRects,
  type OverlayShapeRect,
} from './islandWindowShapeGeometry'

interface StackShapeObservers {
  resizeObserver: ResizeObserver
  mutationObserver: MutationObserver
  stack: HTMLElement
}

const SHAPE_PADDING_PX = 2
const ISLAND_SHAPE_TRANSITION_PROPERTIES = new Set(['width', 'height', 'transform'])

let shapeAnimationFloor: OverlayShapeRect | null = null
let shapeFrameId: number | null = null
let lastPublishedShapeKey = ''
let activeShapeTransitions = 0

function getIslandStack(): HTMLElement | null {
  const stack = document.querySelector('.dynamic-island-stack')
  return stack instanceof HTMLElement ? stack : null
}

function readIslandShapeRect(): OverlayShapeRect | null {
  const stack = getIslandStack()
  return stack ? readVisibleStackRect(stack) : null
}

function readAnimationEnvelopeRect(): OverlayShapeRect | null {
  const stack = getIslandStack()

  if (!stack) {
    return null
  }

  const visible = readVisibleStackRect(stack)
  const predicted = readPredictedSettledRect(stack)

  return visible ? unionRects(visible, predicted) : predicted
}

function toWindowShapeRect(rect: OverlayShapeRect): OverlayShapeRect {
  return clampRectToWindow(inflateRect(rect, SHAPE_PADDING_PX))
}

function publishIslandWindowShape(): void {
  const measured = readIslandShapeRect()

  if (!measured || !isPositiveRect(measured)) {
    lastPublishedShapeKey = ''
    window.veluraDesktopIsland?.setWindowShape([])
    return
  }

  const grown = shapeAnimationFloor ? unionRects(shapeAnimationFloor, measured) : measured
  const shape = toWindowShapeRect(grown)
  const shapeKey = toRectKey(shape)

  if (!isPositiveRect(shape) || shapeKey === lastPublishedShapeKey) {
    return
  }

  lastPublishedShapeKey = shapeKey
  window.veluraDesktopIsland?.setWindowShape([shape])
}

function stopShapeFrameLoop(): void {
  if (shapeFrameId === null) {
    return
  }

  window.cancelAnimationFrame(shapeFrameId)
  shapeFrameId = null
}

function startShapeFrameLoop(): void {
  if (shapeFrameId !== null) {
    return
  }

  const tick = (): void => {
    publishIslandWindowShape()
    shapeFrameId = window.requestAnimationFrame(tick)
  }

  shapeFrameId = window.requestAnimationFrame(tick)
}

function beginShapeAnimation(): void {
  const envelope = readAnimationEnvelopeRect()

  if (envelope) {
    shapeAnimationFloor = shapeAnimationFloor
      ? unionRects(shapeAnimationFloor, envelope)
      : envelope
  }

  startShapeFrameLoop()
  publishIslandWindowShape()
}

function endShapeAnimation(): void {
  if (activeShapeTransitions > 0) {
    return
  }

  shapeAnimationFloor = null
  stopShapeFrameLoop()
  publishIslandWindowShape()
}

function isIslandShapeTransition(event: TransitionEvent): boolean {
  const target = event.target

  if (!(target instanceof Element) || !target.closest('.dynamic-island-stack')) {
    return false
  }

  return ISLAND_SHAPE_TRANSITION_PROPERTIES.has(event.propertyName)
}

function handleShapeTransitionRun(event: TransitionEvent): void {
  if (!isIslandShapeTransition(event)) {
    return
  }

  activeShapeTransitions += 1
  beginShapeAnimation()
}

function handleShapeTransitionSettled(event: TransitionEvent): void {
  if (!isIslandShapeTransition(event)) {
    return
  }

  activeShapeTransitions = Math.max(0, activeShapeTransitions - 1)
  endShapeAnimation()
}

function bindStackShapeTransitions(stack: HTMLElement): void {
  stack.addEventListener('transitionrun', handleShapeTransitionRun, true)
  stack.addEventListener('transitionend', handleShapeTransitionSettled, true)
  stack.addEventListener('transitioncancel', handleShapeTransitionSettled, true)
}

function unbindStackShapeTransitions(stack: HTMLElement): void {
  stack.removeEventListener('transitionrun', handleShapeTransitionRun, true)
  stack.removeEventListener('transitionend', handleShapeTransitionSettled, true)
  stack.removeEventListener('transitioncancel', handleShapeTransitionSettled, true)
}

function handleStackDomChange(): void {
  const island = getIslandStack()?.querySelector('.dynamic-island')
  const isSizeTransitioning =
    island instanceof HTMLElement && island.classList.contains('dynamic-island--size-transition')

  if (isSizeTransitioning) {
    beginShapeAnimation()
    return
  }

  publishIslandWindowShape()
}

function createStackShapeObservers(stack: HTMLElement): StackShapeObservers {
  const resizeObserver = new ResizeObserver(publishIslandWindowShape)
  const mutationObserver = new MutationObserver(handleStackDomChange)

  resizeObserver.observe(stack)
  mutationObserver.observe(stack, {
    attributes: true,
    attributeFilter: ['class', 'style'],
    subtree: true,
  })
  bindStackShapeTransitions(stack)

  return { resizeObserver, mutationObserver, stack }
}

function disconnectStackShapeObservers(observers: StackShapeObservers | null): void {
  observers?.resizeObserver.disconnect()
  observers?.mutationObserver.disconnect()

  if (observers?.stack) {
    unbindStackShapeTransitions(observers.stack)
  }
}

function resetShapeTracking(): void {
  activeShapeTransitions = 0
  shapeAnimationFloor = null
  lastPublishedShapeKey = ''
  stopShapeFrameLoop()
}

/** Observa la isla y recorta la ventana al rectángulo que cubre toda la animación. */
export function syncDesktopIslandWindowShape(): () => void {
  let stackObservers: StackShapeObservers | null = null

  const syncStackObservers = (): void => {
    const stack = getIslandStack()

    if (!stack) {
      disconnectStackShapeObservers(stackObservers)
      stackObservers = null
      resetShapeTracking()
      window.veluraDesktopIsland?.setWindowShape([])
      return
    }

    if (stackObservers?.stack === stack) {
      return
    }

    disconnectStackShapeObservers(stackObservers)
    stackObservers = createStackShapeObservers(stack)
    publishIslandWindowShape()
  }

  const rootObserver = new MutationObserver(syncStackObservers)
  rootObserver.observe(document.body, { childList: true, subtree: true })
  syncStackObservers()

  return () => {
    rootObserver.disconnect()
    disconnectStackShapeObservers(stackObservers)
    resetShapeTracking()
  }
}
