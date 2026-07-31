/** Registra handlers IPC para acciones de ventana (p. ej. pantalla completa). */
import { BrowserWindow, ipcMain } from 'electron'
import { DESKTOP_WINDOW_IPC_CHANNELS } from '../../shared/desktop'
import { assertMainWindowSender, setMainWindowWebContents } from '../security/ipcMainWindowGuard'

let mainWindow: BrowserWindow | null = null

function resolveTargetWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? mainWindow
}

function notifyFullscreenChanged(isFullscreen: boolean): void {
  mainWindow?.webContents.send(DESKTOP_WINDOW_IPC_CHANNELS.fullscreenChanged, isFullscreen)
}

/** Guarda la ventana principal y escucha cambios nativos de pantalla completa (p. ej. F11). */
export function attachMainWindow(window: BrowserWindow): void {
  mainWindow = window
  setMainWindowWebContents(window.webContents)

  window.on('enter-full-screen', () => {
    notifyFullscreenChanged(true)
  })

  window.on('leave-full-screen', () => {
    notifyFullscreenChanged(false)
  })
}

/** Enlaza los canales IPC de ventana con el proceso principal de Electron. */
export function registerWindowIpc(): void {
  ipcMain.handle(DESKTOP_WINDOW_IPC_CHANNELS.toggleFullscreen, (event) => {
    assertMainWindowSender(event)

    const window = resolveTargetWindow()

    if (!window) {
      return false
    }

    const nextFullscreen = !window.isFullScreen()
    window.setFullScreen(nextFullscreen)
    return nextFullscreen
  })

  ipcMain.handle(DESKTOP_WINDOW_IPC_CHANNELS.getFullscreen, (event) => {
    assertMainWindowSender(event)
    return resolveTargetWindow()?.isFullScreen() ?? false
  })
}
