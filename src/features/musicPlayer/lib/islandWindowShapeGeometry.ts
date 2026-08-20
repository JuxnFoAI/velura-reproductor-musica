/** Geometría del recorte visible de la isla dinámica en la overlay de escritorio. */

export interface OverlayShapeRect {
  x: number
  y: number
  width: number
  height: number
}

export function isPositiveRect(rect: OverlayShapeRect): boolean {
  return rect.width > 0 && rect.height > 0
}

export function toRectKey(rect: OverlayShapeRect): string {
  return `${rect.x},${rect.y},${rect.width},${rect.height}`
}

export function unionRects(first: OverlayShapeRect, second: OverlayShapeRect): OverlayShapeRect {
  const x = Math.min(first.x, second.x)
  const y = Math.min(first.y, second.y)
  const right = Math.max(first.x + first.width, second.x + second.width)
  const bottom = Math.max(first.y + first.height, second.y + second.height)

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  }
}

export function inflateRect(rect: OverlayShapeRect, padding: number): OverlayShapeRect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

export function clampRectToWindow(rect: OverlayShapeRect): OverlayShapeRect {
  const x = Math.max(0, rect.x)
  const y = Math.max(0, rect.y)
  const right = Math.min(window.innerWidth, rect.x + rect.width)
  const bottom = Math.min(window.innerHeight, rect.y + rect.height)

  return {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.max(0, Math.ceil(right - x)),
    height: Math.max(0, Math.ceil(bottom - y)),
  }
}

function rectFromDomRect(rect: DOMRectReadOnly): OverlayShapeRect {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  }
}

function intersectDomRects(
  first: DOMRectReadOnly,
  second: DOMRectReadOnly,
): OverlayShapeRect | null {
  const x = Math.max(first.x, second.x)
  const y = Math.max(first.y, second.y)
  const right = Math.min(first.right, second.right)
  const bottom = Math.min(first.bottom, second.bottom)

  if (right <= x || bottom <= y) {
    return null
  }

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  }
}

function readTransformTranslateY(transform: string): number {
  if (transform === 'none') {
    return 0
  }

  if (transform.startsWith('matrix3d(')) {
    const values = transform
      .slice(9, -1)
      .split(',')
      .map((value) => Number(value.trim()))
    return Number.isFinite(values[13]) ? values[13] : 0
  }

  if (transform.startsWith('matrix(')) {
    const values = transform
      .slice(7, -1)
      .split(',')
      .map((value) => Number(value.trim()))
    return Number.isFinite(values[5]) ? values[5] : 0
  }

  return 0
}

function readUntransformedRect(element: HTMLElement): OverlayShapeRect {
  const visual = rectFromDomRect(element.getBoundingClientRect())
  const translateY = readTransformTranslateY(getComputedStyle(element).transform)

  return {
    ...visual,
    y: visual.y - translateY,
  }
}

function addCenteredGrowth(
  rect: OverlayShapeRect,
  extraWidth: number,
  extraHeight: number,
): OverlayShapeRect {
  return {
    x: rect.x - extraWidth / 2,
    y: rect.y,
    width: rect.width + extraWidth,
    height: rect.height + extraHeight,
  }
}

function readExpandedIslandTargetRect(island: HTMLElement): OverlayShapeRect | null {
  const targetWidth = Number.parseFloat(island.style.width)
  const targetHeight = Number.parseFloat(island.style.height)

  if (!Number.isFinite(targetWidth) || !Number.isFinite(targetHeight)) {
    return null
  }

  const visual = rectFromDomRect(island.getBoundingClientRect())
  return addCenteredGrowth(
    visual,
    Math.max(0, targetWidth - visual.width),
    Math.max(0, targetHeight - visual.height),
  )
}

export function readVisibleStackRect(stack: HTMLElement): OverlayShapeRect | null {
  const visual = stack.getBoundingClientRect()
  const anchor = stack.parentElement

  if (!(anchor instanceof HTMLElement)) {
    return rectFromDomRect(visual)
  }

  return intersectDomRects(visual, anchor.getBoundingClientRect())
}

export function readPredictedSettledRect(stack: HTMLElement): OverlayShapeRect {
  const settledStack = readUntransformedRect(stack)
  const island = stack.querySelector('.dynamic-island')

  if (!(island instanceof HTMLElement) || !island.classList.contains('dynamic-island--expanded')) {
    return settledStack
  }

  const islandTarget = readExpandedIslandTargetRect(island)

  if (!islandTarget) {
    return settledStack
  }

  const islandVisual = island.getBoundingClientRect()
  return addCenteredGrowth(
    settledStack,
    Math.max(0, islandTarget.width - islandVisual.width),
    Math.max(0, islandTarget.height - islandVisual.height),
  )
}
