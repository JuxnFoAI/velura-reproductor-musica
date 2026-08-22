/** Proceso principal de Electron: ventana, IPC y protocolo de medios. */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow } from 'electron'
import { registerMusicLibraryIpc } from './ipc/registerMusicLibraryIpc'
import { attachMainWindow, registerWindowIpc } from './ipc/registerWindowIpc'
import {
  registerMediaProtocolHandler,
  registerMediaProtocolScheme,
} from './media/registerMediaProtocol'
import { initializeElectronMusicDirectory } from './musicDirectory'
import { resolvePreloadPath, resolveRendererIndexPath } from './paths'
import { DESKTOP_RENDERER_WEB_PREFERENCES } from './security/rendererWebPreferences'
import {
  registerNavigationGuards,
  resolveSafeDevServerUrl,
} from './security/registerNavigationGuards'

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function resolveWindowIconPath(): string {
  return path.join(projectRoot, 'build', 'icon.ico')
}

registerMediaProtocolScheme()

function isElectronDevMode(): boolean {
  return process.argv.includes('--dev')
}

function attachNavigationGuards(mainWindow: BrowserWindow): void {
  registerNavigationGuards(mainWindow.webContents, {
    isDevMode: isElectronDevMode(),
    devServerUrl: resolveSafeDevServerUrl(process.env.VITE_DEV_SERVER_URL),
    productionIndexPath: resolveRendererIndexPath(),
  })
}

function shouldOpenDevTools(): boolean {
  return process.env.VELURA_OPEN_DEVTOOLS === '1'
}

function loadRenderer(mainWindow: BrowserWindow): void {
  if (isElectronDevMode()) {
    void mainWindow.loadURL(resolveSafeDevServerUrl(process.env.VITE_DEV_SERVER_URL))

    if (shouldOpenDevTools()) {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }

    return
  }

  void mainWindow.loadFile(resolveRendererIndexPath())
}

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Velura',
    icon: resolveWindowIconPath(),
    webPreferences: {
      preload: resolvePreloadPath(),
      ...DESKTOP_RENDERER_WEB_PREFERENCES,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  attachNavigationGuards(mainWindow)
  loadRenderer(mainWindow)
  attachMainWindow(mainWindow)
  return mainWindow
}

app.whenReady().then(() => {
  initializeElectronMusicDirectory()
  registerMusicLibraryIpc()
  registerWindowIpc()
  registerMediaProtocolHandler()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
