/** IPC de la isla dinámica flotante: estado, comandos y click-through. */

import { BrowserWindow, ipcMain, screen } from 'electron'
import {
  DESKTOP_ISLAND_IPC_CHANNELS,
  isDesktopIslandCommand,
  isDesktopIslandStateSnapshot,
  type DesktopIslandStateSnapshot,
  type DesktopIslandWindowShapeRect,
} from '../../shared/desktop'
import {
  applyDesktopIslandWindowShape,
  createDesktopIslandWindow,
  repositionDesktopIslandWindow,
  showDesktopIslandOverlay,
} from '../island'
import {
  assertIslandWindowSender,
  assertMainWindowSender,
} from '../security/ipcMainWindowGuard'

let mainWindow: BrowserWindow | null = null
let islandWindow: BrowserWindow | null = null
let lastSnapshot: DesktopIslandStateSnapshot | null = null
let lastMainDisplayId: number | null = null
let pendingIslandShape: DesktopIslandWindowShapeRect[] | null = null
let isIslandShapeFlushScheduled = false

function isUsableWindow(window: BrowserWindow | null): window is BrowserWindow {
  return window !== null && !window.isDestroyed()
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isShapeRect(value: unknown): value is DesktopIslandWindowShapeRect {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const rect = value as Record<string, unknown>

  return (
    isNonNegativeFiniteNumber(rect.x) &&
    isNonNegativeFiniteNumber(rect.y) &&
    isNonNegativeFiniteNumber(rect.width) &&
    isNonNegativeFiniteNumber(rect.height)
  )
}

function isWindowShapePayload(value: unknown): value is DesktopIslandWindowShapeRect[] {
  return Array.isArray(value) && value.every(isShapeRect)
}

function flushPendingIslandWindowShape(): void {
  isIslandShapeFlushScheduled = false

  if (!isUsableWindow(islandWindow) || pendingIslandShape === null) {
    return
  }

  applyDesktopIslandWindowShape(islandWindow, pendingIslandShape)
  pendingIslandShape = null
}

function queueIslandWindowShape(rects: DesktopIslandWindowShapeRect[]): void {
  pendingIslandShape = rects

  if (isIslandShapeFlushScheduled) {
    return
  }

  isIslandShapeFlushScheduled = true
  queueMicrotask(flushPendingIslandWindowShape)
}

function syncIslandVisibility(snapshot: DesktopIslandStateSnapshot): void {
  if (!isUsableWindow(islandWindow)) {
    return
  }

  const shouldShow = snapshot.isEnabled && snapshot.currentTrack !== null

  if (shouldShow && !islandWindow.isVisible()) {
    showDesktopIslandOverlay(islandWindow)
    return
  }

  if (!shouldShow && islandWindow.isVisible()) {
    islandWindow.hide()
  }
}

function ensureIslandWindow(): BrowserWindow | null {
  if (!isUsableWindow(mainWindow)) {
    return null
  }

  if (isUsableWindow(islandWindow)) {
    return islandWindow
  }

  islandWindow = createDesktopIslandWindow(mainWindow)
  return islandWindow
}

function sendStateToIsland(snapshot: DesktopIslandStateSnapshot): void {
  if (!isUsableWindow(islandWindow)) {
    return
  }

  islandWindow.webContents.send(DESKTOP_ISLAND_IPC_CHANNELS.stateChanged, snapshot)
}

function dispatchCommandToMain(command: unknown): void {
  if (!isUsableWindow(mainWindow) || !isDesktopIslandCommand(command)) {
    return
  }

  mainWindow.webContents.send(DESKTOP_ISLAND_IPC_CHANNELS.dispatchCommand, command)
}

export function destroyDesktopIslandWindow(): void {
  if (isUsableWindow(islandWindow)) {
    islandWindow.destroy()
  }

  islandWindow = null
  lastSnapshot = null
  lastMainDisplayId = null
}

export function attachDesktopIslandWindows(window: BrowserWindow): void {
  mainWindow = window
  ensureIslandWindow()

  const repositionIfDisplayChanged = (): void => {
    if (!isUsableWindow(mainWindow) || !isUsableWindow(islandWindow)) {
      return
    }

    const displayId = screen.getDisplayMatching(mainWindow.getBounds()).id

    if (displayId === lastMainDisplayId) {
      return
    }

    lastMainDisplayId = displayId
    repositionDesktopIslandWindow(islandWindow, mainWindow)
  }

  window.on('moved', repositionIfDisplayChanged)
  screen.on('display-metrics-changed', repositionIfDisplayChanged)

  window.on('closed', () => {
    screen.removeListener('display-metrics-changed', repositionIfDisplayChanged)
    mainWindow = null
    destroyDesktopIslandWindow()
  })
}

export function registerDesktopIslandIpc(): void {
  ipcMain.on(DESKTOP_ISLAND_IPC_CHANNELS.publishState, (event, payload: unknown) => {
    assertMainWindowSender(event)

    if (!isDesktopIslandStateSnapshot(payload)) {
      return
    }

    lastSnapshot = payload
    ensureIslandWindow()
    syncIslandVisibility(payload)
    sendStateToIsland(payload)
  })

  ipcMain.on(DESKTOP_ISLAND_IPC_CHANNELS.requestState, (event) => {
    assertIslandWindowSender(event)

    if (lastSnapshot) {
      sendStateToIsland(lastSnapshot)
    }
  })

  ipcMain.handle(DESKTOP_ISLAND_IPC_CHANNELS.sendCommand, (event, payload: unknown) => {
    assertIslandWindowSender(event)
    dispatchCommandToMain(payload)
  })

  ipcMain.handle(DESKTOP_ISLAND_IPC_CHANNELS.setIgnoreMouse, (event, ignore: unknown) => {
    assertIslandWindowSender(event)

    if (!isUsableWindow(islandWindow) || typeof ignore !== 'boolean') {
      return
    }

    islandWindow.setIgnoreMouseEvents(ignore, { forward: true })
  })

  ipcMain.on(DESKTOP_ISLAND_IPC_CHANNELS.setWindowShape, (event, payload: unknown) => {
    assertIslandWindowSender(event)

    if (!isWindowShapePayload(payload)) {
      return
    }

    queueIslandWindowShape(payload)
  })
}
