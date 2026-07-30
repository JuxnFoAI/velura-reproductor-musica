/** Tipos para letras sincronizadas y parsing de archivos .lrc / .txt. */



export interface LyricsLine {

  text: string

  /** Segundo de inicio de la línea dentro de la pista. */

  startTime: number

}



export interface ParsedLyrics {

  lines: LyricsLine[]

  /** Indica si el archivo incluye timestamps LRC reales. */

  isSynced: boolean

}


