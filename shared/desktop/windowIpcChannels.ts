/** Canales IPC para acciones de ventana en la app de escritorio. */

export const DESKTOP_WINDOW_IPC_CHANNELS = {
  toggleFullscreen: 'velura:window:toggle-fullscreen',
  getFullscreen: 'velura:window:get-fullscreen',
  fullscreenChanged: 'velura:window:fullscreen-changed',
} as const

export const DESKTOP_ISLAND_IPC_CHANNELS = {
  publishState: 'velura:island:publish-state',
  stateChanged: 'velura:island:state-changed',
  sendCommand: 'velura:island:send-command',
  dispatchCommand: 'velura:island:dispatch-command',
  setIgnoreMouse: 'velura:island:set-ignore-mouse',
  setWindowShape: 'velura:island:set-window-shape',
  requestState: 'velura:island:request-state',
} as const
