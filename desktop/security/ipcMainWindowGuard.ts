/** Restringe handlers IPC a invocaciones desde la ventana principal. */
import type { IpcMainInvokeEvent, WebContents } from 'electron'

let mainWindowWebContents: WebContents | null = null

/** Registra el WebContents de la ventana principal como único emisor IPC autorizado. */
export function setMainWindowWebContents(webContents: WebContents): void {
  mainWindowWebContents = webContents
}

/** Rechaza invocaciones IPC que no provengan de la ventana principal. */
export function assertMainWindowSender(event: IpcMainInvokeEvent): void {
  if (!mainWindowWebContents || event.sender !== mainWindowWebContents) {
    throw Object.assign(new Error('Invocación IPC no autorizada.'), { status: 403 })
  }
}
