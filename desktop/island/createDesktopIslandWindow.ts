/** Ventana flotante always-on-top de la isla dinámica en el escritorio. */

import { BrowserWindow, screen } from 'electron'
import {
  DESKTOP_ISLAND_QUERY_PARAM,
  DESKTOP_ISLAND_QUERY_VALUE,
} from '../../shared/desktop'
import { attachOverlayWindowChromeGuards } from './windowsOverlayChrome'
import { resolvePreloadPath, resolveRendererIndexPath } from '../paths'
import { setIslandWindowWebContents } from '../security/ipcMainWindowGuard'
import {
  registerNavigationGuards,
  resolveSafeDevServerUrl,
} from '../security/registerNavigationGuards'

const OVERLAY_WIDTH_PX = 520
const OVERLAY_HEIGHT_PX = 200
const OVERLAY_TOP_OFFSET_PX = 8

function isElectronDevMode(): boolean {
  return process.argv.includes('--dev')
}

function resolveOverlayBounds(anchorWindow: BrowserWindow | null) {
  const anchorBounds = anchorWindow?.getBounds()
  const display = anchorBounds
    ? screen.getDisplayMatching(anchorBounds)
    : screen.getPrimaryDisplay()
  const { x, y, width } = display.workArea

  return {
    x: Math.round(x + (width - OVERLAY_WIDTH_PX) / 2),
    y: y + OVERLAY_TOP_OFFSET_PX,
    width: OVERLAY_WIDTH_PX,
    height: OVERLAY_HEIGHT_PX,
  }
}

function buildOverlayUrl(): { type: 'url'; url: string } | { type: 'file'; filePath: string } {
  const query = `${DESKTOP_ISLAND_QUERY_PARAM}=${DESKTOP_ISLAND_QUERY_VALUE}`

  if (isElectronDevMode()) {
    const baseUrl = resolveSafeDevServerUrl(process.env.VITE_DEV_SERVER_URL)
    return { type: 'url', url: `${baseUrl}/?${query}` }
  }

  return { type: 'file', filePath: resolveRendererIndexPath() }
}

function loadOverlayRenderer(overlayWindow: BrowserWindow): void {
  const target = buildOverlayUrl()

  if (target.type === 'url') {
    void overlayWindow.loadURL(target.url)
    return
  }

  void overlayWindow.loadFile(target.filePath, {
    query: { [DESKTOP_ISLAND_QUERY_PARAM]: DESKTOP_ISLAND_QUERY_VALUE },
  })
}

function createOverlayWindow(bounds: {
  x: number
  y: number
  width: number
  height: number
}): BrowserWindow {
  const overlayWindow = new BrowserWindow({
    ...bounds,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    thickFrame: false,
    roundedCorners: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    movable: false,
    acceptFirstMouse: true,
    autoHideMenuBar: true,
    title: '',
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  })

  attachOverlayWindowChromeGuards(overlayWindow)
  overlayWindow.setFocusable(false)
  return overlayWindow
}

export function createDesktopIslandWindow(mainWindow: BrowserWindow): BrowserWindow {
  const overlayWindow = createOverlayWindow(resolveOverlayBounds(mainWindow))

  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  setIslandWindowWebContents(overlayWindow.webContents)

  registerNavigationGuards(overlayWindow.webContents, {
    isDevMode: isElectronDevMode(),
    devServerUrl: resolveSafeDevServerUrl(process.env.VITE_DEV_SERVER_URL),
    productionIndexPath: resolveRendererIndexPath(),
  })

  overlayWindow.on('closed', () => {
    setIslandWindowWebContents(null)
  })

  loadOverlayRenderer(overlayWindow)
  return overlayWindow
}

export function showDesktopIslandOverlay(overlayWindow: BrowserWindow): void {
  if (overlayWindow.isDestroyed()) {
    return
  }

  overlayWindow.showInactive()
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
}

export function repositionDesktopIslandWindow(
  overlayWindow: BrowserWindow,
  anchorWindow: BrowserWindow | null,
): void {
  if (overlayWindow.isDestroyed()) {
    return
  }

  overlayWindow.setBounds(resolveOverlayBounds(anchorWindow))
}
