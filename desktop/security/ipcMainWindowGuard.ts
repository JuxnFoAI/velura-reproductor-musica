/** Restringe handlers IPC a las ventanas autorizadas de Velura. */
import type { IpcMainEvent, IpcMainInvokeEvent, WebContents } from 'electron'

let mainWindowWebContents: WebContents | null = null
let islandWindowWebContents: WebContents | null = null

/** Registra el WebContents de la ventana principal como emisor IPC autorizado. */
export function setMainWindowWebContents(webContents: WebContents): void {
  mainWindowWebContents = webContents
}

/** Registra el WebContents de la isla flotante como emisor IPC autorizado. */
export function setIslandWindowWebContents(webContents: WebContents | null): void {
  islandWindowWebContents = webContents
}

function isAuthorizedSender(
  event: IpcMainInvokeEvent | IpcMainEvent,
  expected: WebContents | null,
): boolean {
  return expected !== null && event.sender === expected
}

/** Rechaza invocaciones IPC que no provengan de la ventana principal. */
export function assertMainWindowSender(event: IpcMainInvokeEvent | IpcMainEvent): void {
  if (!isAuthorizedSender(event, mainWindowWebContents)) {
    throw Object.assign(new Error('Invocación IPC no autorizada.'), { status: 403 })
  }
}

/** Rechaza invocaciones IPC que no provengan de la isla flotante. */
export function assertIslandWindowSender(event: IpcMainInvokeEvent | IpcMainEvent): void {
  if (!isAuthorizedSender(event, islandWindowWebContents)) {
    throw Object.assign(new Error('Invocación IPC no autorizada.'), { status: 403 })
  }
}
