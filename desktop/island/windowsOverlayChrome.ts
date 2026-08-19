/** Oculta el cromado nativo de Windows que Windows 11 pinta detrás de la isla. */

import type { BrowserWindow, Rectangle } from 'electron'

const WM_NCPAINT = 0x0085
const WM_NCACTIVATE = 0x0086
const WM_NCUAHDRAWCAPTION = 0x00ae
const WM_NCUAHDRAWFRAME = 0x00af
const REDRAW_DELTA_PX = 1

const CAPTION_PAINT_MESSAGES = [
  WM_NCPAINT,
  WM_NCACTIVATE,
  WM_NCUAHDRAWCAPTION,
  WM_NCUAHDRAWFRAME,
] as const

const overlayWindowShapes = new WeakMap<BrowserWindow, Rectangle[]>()

function areWindowShapesEqual(
  first: Rectangle[] | undefined,
  second: Rectangle[],
): boolean {
  if (!first || first.length !== second.length) {
    return false
  }

  return first.every((rect, index) => {
    const other = second[index]

    return (
      other !== undefined &&
      rect.x === other.x &&
      rect.y === other.y &&
      rect.width === other.width &&
      rect.height === other.height
    )
  })
}

/** Evita que el renderer vuelva a poner el título de la app en la overlay. */
function suppressOverlayWindowTitle(overlayWindow: BrowserWindow): void {
  overlayWindow.setTitle('')
  overlayWindow.on('page-title-updated', (event) => {
    event.preventDefault()
  })
}

function forcePixelRedraw(overlayWindow: BrowserWindow): void {
  const bounds = overlayWindow.getBounds()
  overlayWindow.setBounds({ ...bounds, height: bounds.height + REDRAW_DELTA_PX })
  overlayWindow.setBounds(bounds)
}

function swallowCaptionPaintMessages(overlayWindow: BrowserWindow): void {
  for (const message of CAPTION_PAINT_MESSAGES) {
    overlayWindow.hookWindowMessage(message, () => true)
  }
}

/** Reaplica transparencia y oculta la pestaña nativa tras mostrar o perder el foco. */
export function refreshOverlayWindowChrome(overlayWindow: BrowserWindow): void {
  if (overlayWindow.isDestroyed()) {
    return
  }

  overlayWindow.setTitle('')
  overlayWindow.setHasShadow(false)
  overlayWindow.setMenu(null)
  overlayWindow.setMaximizable(false)
  overlayWindow.setBackgroundColor('#00000000')

  if (process.platform === 'win32') {
    overlayWindow.setBackgroundMaterial('none')
    forcePixelRedraw(overlayWindow)
    restoreOverlayWindowShape(overlayWindow)
  }
}

/** Recorta la HWND a la isla visible para que el cromado nativo no asome alrededor. */
export function applyDesktopIslandWindowShape(
  overlayWindow: BrowserWindow,
  rects: Rectangle[],
): void {
  if (overlayWindow.isDestroyed() || typeof overlayWindow.setShape !== 'function') {
    return
  }

  if (areWindowShapesEqual(overlayWindowShapes.get(overlayWindow), rects)) {
    return
  }

  const nextRects = rects.map((rect) => ({ ...rect }))
  overlayWindowShapes.set(overlayWindow, nextRects)
  overlayWindow.setShape(nextRects)
}

function restoreOverlayWindowShape(overlayWindow: BrowserWindow): void {
  const rects = overlayWindowShapes.get(overlayWindow)

  if (!rects || typeof overlayWindow.setShape !== 'function') {
    return
  }

  overlayWindow.setShape(rects)
}

/** Instala las defensas contra el recuadro/pestaña nativo de Windows. */
export function attachOverlayWindowChromeGuards(overlayWindow: BrowserWindow): void {
  suppressOverlayWindowTitle(overlayWindow)
  refreshOverlayWindowChrome(overlayWindow)

  if (process.platform !== 'win32') {
    return
  }

  swallowCaptionPaintMessages(overlayWindow)
  overlayWindow.on('blur', () => refreshOverlayWindowChrome(overlayWindow))
  overlayWindow.on('show', () => refreshOverlayWindowChrome(overlayWindow))
}
