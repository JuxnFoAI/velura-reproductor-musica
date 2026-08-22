/** Metadatos públicos de la aplicación para pantallas informativas. */

import { isDesktopApp } from './runtimeEnvironment'

export const APP_NAME = 'Velura'

export const APP_VERSION = '1.2.1'

export const APP_DESCRIPTION =
  'Reproductor de música local diseñado para escuchar tu biblioteca con control total, letras sincronizadas y listas personalizadas.'

export const APP_FEATURES = [
  'Reproducción de audio con Web Audio',
  'Biblioteca musical local',
  'Letras sincronizadas (LRC)',
  'Portadas y metadatos editables',
  'Listas de reproducción y favoritos',
  'Persistencia de sesión y preferencias',
] as const

export const APP_PRIVACY_NOTICE =
  'Tu música, listas y ajustes permanecen en este dispositivo. No se envían archivos ni datos personales a servidores externos.'

export const APP_LEGAL_NOTICE =
  'Las canciones y portadas son responsabilidad del usuario. Asegúrate de contar con los derechos para reproducir tu biblioteca.'

/**
 * Etiqueta legible del entorno de ejecución sin exponer detalles técnicos internos.
 */
export function getAppRuntimeLabel(): string {
  return isDesktopApp() ? 'Aplicación de escritorio' : 'Navegador web'
}
