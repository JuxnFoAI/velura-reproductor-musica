/** Restringe handlers IPC a las ventanas autorizadas de Velura. */
import type { IpcMainEvent, IpcMainInvokeEvent, WebContents } from 'electron'

let mainWindowWebContents: WebContents | null = null

/** Registra el WebContents de la ventana principal como emisor IPC autorizado. */
export function setMainWindowWebContents(webContents: WebContents): void {
  mainWindowWebContents = webContents
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
