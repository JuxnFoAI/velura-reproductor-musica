/** Motor de audio singleton basado en Web Audio API para el reproductor. */
import {
  clampEqualizerGainDb,
  EQ_BAND_DEFINITIONS,
  EQ_FILTER_Q,
} from '@lib/equalizerConstants'
import {
  computeVolumeNormalizationGainDb,
  normalizationGainDbToLinear,
} from '@lib/computeVolumeNormalizationGain'
import type { VolumeNormalizationModeId } from '@lib/volumeNormalizationConstants'

import type { Track } from '../types'

const MIN_VOLUME = 0
const MAX_VOLUME = 1
const DEFAULT_FADE_MS = 200

const ANALYSER_FFT_SIZE = 2048
const ANALYSER_SMOOTHING = 0.8
const EQ_BAND_COUNT = EQ_BAND_DEFINITIONS.length

export const AUDIO_CONTEXT_BLOCKED_ERROR = 'AUDIO_CONTEXT_BLOCKED'

/**
 * Encapsula toda la interacci?n con la Web Audio API: reproducci?n, volumen
 * y datos de an?lisis para el visualizador.
 */
class AudioEngine {
  private audioContext: AudioContext | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private analyserNode: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private normalizationGainNode: GainNode | null = null
  private equalizerFilters: BiquadFilterNode[] = []
  private isEqualizerEnabled = false
  private equalizerGainsDb: number[] = Array.from({ length: EQ_BAND_COUNT }, () => 0)
  private isVolumeNormalizationEnabled = false
  private volumeNormalizationMode: VolumeNormalizationModeId = 'balanced'
  private trackReplayGainDb: number | null = null
  private appliedVolumeNormalizationGainDb = 0
  private audioBuffer: AudioBuffer | null = null
  private currentTrack: Track | null = null
  private loadGeneration = 0

  private playbackStartTime = 0
  private playbackOffset = 0
  private isPlaying = false

  private volume = 1
  private isMuted = false

  private timeUpdateFrameId: number | null = null
  private analyserDataBuffer: Uint8Array<ArrayBuffer> | null = null

  /** Se invoca peri?dicamente con la posici?n y duraci?n actuales en segundos. */
  onTimeUpdate: ((currentTime: number, duration: number) => void) | null = null

  /** Se invoca cuando la pista termina de reproducirse de forma natural. */
  onTrackEnd: (() => void) | null = null

  /** Se invoca cuando ocurre un error en una operaci?n del motor de audio. */
  onError: ((message: string) => void) | null = null

  /** Se invoca cuando cambia la ganancia de normalizaci?n aplicada a la pista actual. */
  onVolumeNormalizationChange: ((gainDb: number) => void) | null = null

  /**
   * Descarga y decodifica una pista desde su object URL.
   * @param track - Pista con la URL del archivo de audio.
   * @returns `true` si el buffer qued? aplicado; `false` si una carga m?s reciente lo invalid?.
   */
  async loadTrack(track: Track): Promise<boolean> {
    const context = await this.ensureContext()
    const loadId = ++this.loadGeneration

    this.stopPlayback({ resetPosition: true })

    const response = await fetch(track.src)

    if (loadId !== this.loadGeneration) {
      return false
    }

    if (!response.ok) {
      this.fail('Error al cargar la pista', `No se pudo cargar el audio (${response.status})`)
    }

    try {
      const encodedAudio = await response.arrayBuffer()

      if (loadId !== this.loadGeneration) {
        return false
      }

      const decodedBuffer = await context.decodeAudioData(encodedAudio.slice(0))

      if (loadId !== this.loadGeneration) {
        return false
      }

      // Un play concurrente pudo reanudar el buffer anterior durante el fetch.
      this.stopPlayback({ resetPosition: true })
      this.audioBuffer = decodedBuffer
      this.currentTrack = track
      this.trackReplayGainDb = track.replayGainTrackDb ?? null
      this.refreshVolumeNormalization()
      this.emitTimeUpdate()
      return true
    } catch (error) {
      if (loadId !== this.loadGeneration) {
        return false
      }

      this.fail('Error al decodificar la pista', error)
    }
  }

  /**
   * Inicia o reanuda la reproducci?n de la pista cargada.
   */
  async play(): Promise<void> {
    if (!this.audioBuffer) {
      this.fail('Error al reproducir la pista', 'No hay ninguna pista cargada')
    }

    if (this.isPlaying) {
      return
    }

    await this.startPlayback()
    this.applyGain()
  }

  /**
   * Inicia la reproducci?n con fade-in desde silencio.
   */
  async playWithFadeIn(fadeMs: number = DEFAULT_FADE_MS): Promise<void> {
    if (!this.audioBuffer) {
      this.fail('Error al reproducir la pista', 'No hay ninguna pista cargada')
    }

    if (this.isPlaying) {
      return
    }

    await this.startPlayback()
    await this.fadeGainTo(this.getTargetGain(), fadeMs)
  }

  /**
   * Reduce el volumen a cero y pausa la reproducci?n.
   */
  async fadeOutAndPause(fadeMs: number = DEFAULT_FADE_MS): Promise<void> {
    if (!this.isPlaying) {
      return
    }

    await this.fadeGainTo(0, fadeMs)
    this.pause()
  }

  /**
   * Reanuda un AudioContext suspendido tras interacci?n del usuario.
   */
  async resumeContext(): Promise<void> {
    const context = await this.ensureContext(true)

    if (context.state === 'suspended') {
      await context.resume()
    }

    if (context.state === 'suspended') {
      this.fail(
        'Audio bloqueado por el navegador',
        AUDIO_CONTEXT_BLOCKED_ERROR,
      )
    }
  }

  /**
   * Devuelve la pista cuyo buffer est? cargado en el motor, si existe.
   */
  getLoadedTrack(): Track | null {
    return this.currentTrack
  }

  /**
   * Indica si hay un buffer de audio listo para reproducir.
   */
  hasLoadedBuffer(): boolean {
    return this.audioBuffer !== null
  }

  /**
   * Devuelve la duraci?n del buffer decodificado o, en su defecto, la de la pista.
   */
  getLoadedDuration(): number {
    return this.getDuration()
  }

  /**
   * Indica si el motor est? reproduciendo audio activamente.
   */
  isPlayingActive(): boolean {
    return this.isPlaying
  }

  /**
   * Reinicia la pista cargada desde el inicio, incluso tras un fin natural.
   */
  async replayFromStart(): Promise<void> {
    if (!this.audioBuffer) {
      this.fail('Error al repetir la pista', 'No hay ninguna pista cargada')
    }

    this.playbackOffset = 0
    await this.startPlayback()
    this.applyGain()
  }

  /**
   * Pausa la reproducci?n conservando la posici?n actual.
   */
  pause(): void {
    if (!this.isPlaying) {
      return
    }

    this.playbackOffset = this.getCurrentPlaybackTime()
    this.stopSource()
    this.isPlaying = false
    this.stopTimeUpdateLoop()
    this.emitTimeUpdate()
  }

  /**
   * Detiene la reproducci?n y reinicia la posici?n a cero.
   */
  stop(): void {
    this.stopPlayback({ resetPosition: true })
  }

  /**
   * Salta a un punto concreto de la pista en segundos.
   * @param time - Posici?n destino en segundos.
   */
  async seek(time: number): Promise<void> {
    if (!this.audioBuffer) {
      this.fail('Error al buscar en la pista', 'No hay ninguna pista cargada')
    }

    const wasPlaying = this.isPlaying
    this.playbackOffset = this.clampTime(time)

    if (wasPlaying) {
      await this.startPlayback()
      this.applyGain()
    } else {
      this.emitTimeUpdate()
    }
  }

  /**
   * Ajusta el volumen de salida entre 0 (silencio) y 1 (m?ximo).
   * @param volume - Nivel de volumen normalizado.
   */
  setVolume(volume: number): void {
    this.volume = this.clampVolume(volume)
    this.applyGain()
  }

  /**
   * Activa o desactiva el silencio sin modificar el volumen configurado.
   * @param muted - `true` para silenciar, `false` para restaurar el volumen.
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted
    this.applyGain()
  }

  /**
   * Activa o desactiva el ecualizador de 5 bandas.
   * @param enabled - `true` para aplicar las ganancias configuradas.
   */
  setEqualizerEnabled(enabled: boolean): void {
    this.isEqualizerEnabled = enabled
    this.applyEqualizerGains()
  }

  /**
   * Actualiza las ganancias del ecualizador en decibelios, una por banda.
   * @param gainsDb - Ganancias en el mismo orden que {@link EQ_BAND_DEFINITIONS}.
   */
  setEqualizerGains(gainsDb: readonly number[]): void {
    this.equalizerGainsDb = EQ_BAND_DEFINITIONS.map((_, index) =>
      clampEqualizerGainDb(gainsDb[index] ?? 0),
    )
    this.applyEqualizerGains()
  }

  /**
   * Activa o desactiva la normalizaci?n de volumen por pista.
   */
  setVolumeNormalizationEnabled(enabled: boolean): void {
    this.isVolumeNormalizationEnabled = enabled
    this.refreshVolumeNormalization()
  }

  /**
   * Define el modo de normalizaci?n de volumen.
   */
  setVolumeNormalizationMode(mode: VolumeNormalizationModeId): void {
    this.volumeNormalizationMode = mode
    this.refreshVolumeNormalization()
  }

  /**
   * Recalcula y aplica la ganancia de normalizaci?n para el buffer cargado.
   */
  refreshVolumeNormalization(): void {
    if (!this.normalizationGainNode) {
      return
    }

    if (!this.isVolumeNormalizationEnabled || !this.audioBuffer) {
      this.appliedVolumeNormalizationGainDb = 0
      this.normalizationGainNode.gain.value = 1
      this.onVolumeNormalizationChange?.(0)
      return
    }

    const gainDb = computeVolumeNormalizationGainDb(
      this.audioBuffer,
      this.volumeNormalizationMode,
      this.trackReplayGainDb,
    )

    this.appliedVolumeNormalizationGainDb = gainDb
    this.normalizationGainNode.gain.value = normalizationGainDbToLinear(gainDb)
    this.onVolumeNormalizationChange?.(gainDb)
  }

  /**
   * Devuelve la ganancia de normalizaci?n aplicada a la pista actual en dB.
   */
  getAppliedVolumeNormalizationGainDb(): number {
    return this.appliedVolumeNormalizationGainDb
  }

  /**
   * Devuelve los datos de frecuencia del analizador para el visualizador.
   * @returns Buffer con valores de amplitud por bin de frecuencia (0?255).
   */
  getAnalyserData(): Uint8Array {
    if (!this.analyserNode || !this.analyserDataBuffer) {
      return new Uint8Array(0)
    }

    this.analyserNode.getByteFrequencyData(this.analyserDataBuffer)
    return this.analyserDataBuffer
  }

  private async ensureContext(forceResume = false): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
      this.initializeNodeGraph(this.audioContext)
    }

    if (this.audioContext.state === 'suspended' || forceResume) {
      try {
        await this.audioContext.resume()
      } catch {
        this.fail(
          'Audio bloqueado por el navegador',
          AUDIO_CONTEXT_BLOCKED_ERROR,
        )
      }
    }

    if (this.audioContext.state === 'suspended') {
      this.fail(
        'Audio bloqueado por el navegador',
        AUDIO_CONTEXT_BLOCKED_ERROR,
      )
    }

    return this.audioContext
  }

  private initializeNodeGraph(context: AudioContext): void {
    this.analyserNode = context.createAnalyser()
    this.analyserNode.fftSize = ANALYSER_FFT_SIZE
    this.analyserNode.smoothingTimeConstant = ANALYSER_SMOOTHING

    this.gainNode = context.createGain()
    this.gainNode.gain.value = this.volume

    this.normalizationGainNode = context.createGain()
    this.normalizationGainNode.gain.value = 1

    this.initializeEqualizerFilters(context)
    this.getEqualizerOutputNode().connect(this.analyserNode)
    this.analyserNode.connect(this.normalizationGainNode)
    this.normalizationGainNode.connect(this.gainNode)
    this.gainNode.connect(context.destination)

    this.analyserDataBuffer = new Uint8Array(
      new ArrayBuffer(this.analyserNode.frequencyBinCount),
    )
  }

  private async startPlayback(): Promise<void> {
    const context = await this.ensureContext()

    if (!this.audioBuffer || !this.analyserNode) {
      this.fail('Error al reproducir la pista', 'El grafo de audio no est? inicializado')
    }

    this.stopSource()

    const source = context.createBufferSource()
    source.buffer = this.audioBuffer
    source.connect(this.getEqualizerInputNode())

    source.onended = () => {
      if (this.sourceNode !== source) {
        return
      }

      this.isPlaying = false
      this.playbackOffset = 0
      this.sourceNode = null
      this.stopTimeUpdateLoop()
      this.emitTimeUpdate()

      const trackEndCallback = this.onTrackEnd
      if (trackEndCallback) {
        window.setTimeout(trackEndCallback, 0)
      }
    }

    this.sourceNode = source
    this.playbackStartTime = context.currentTime
    source.start(0, this.playbackOffset)
    this.isPlaying = true
    this.startTimeUpdateLoop()
  }

  private stopPlayback(options: { resetPosition: boolean }): void {
    this.stopSource()
    this.isPlaying = false
    this.stopTimeUpdateLoop()

    if (options.resetPosition) {
      this.playbackOffset = 0
    }

    this.emitTimeUpdate()
  }

  private stopSource(): void {
    if (!this.sourceNode) {
      return
    }

    const source = this.sourceNode
    source.onended = null

    try {
      source.stop()
    } catch {
      // El nodo ya pudo haberse detenido.
    }

    source.disconnect()
    this.sourceNode = null
  }

  private getCurrentPlaybackTime(): number {
    if (!this.audioBuffer) {
      return 0
    }

    if (!this.isPlaying || !this.audioContext) {
      return this.playbackOffset
    }

    const elapsed = this.audioContext.currentTime - this.playbackStartTime
    return this.clampTime(this.playbackOffset + elapsed)
  }

  private getDuration(): number {
    return this.audioBuffer?.duration ?? this.currentTrack?.duration ?? 0
  }

  private getTargetGain(): number {
    return this.isMuted ? 0 : this.volume
  }

  private async fadeGainTo(targetGain: number, durationMs: number): Promise<void> {
    if (!this.gainNode || !this.audioContext) {
      return
    }

    const gainParam = this.gainNode.gain
    const startTime = this.audioContext.currentTime
    const endTime = startTime + durationMs / 1000

    gainParam.cancelScheduledValues(startTime)
    gainParam.setValueAtTime(gainParam.value, startTime)
    gainParam.linearRampToValueAtTime(targetGain, endTime)

    await new Promise<void>((resolve) => {
      setTimeout(resolve, durationMs)
    })
  }

  private startTimeUpdateLoop(): void {
    this.stopTimeUpdateLoop()

    const tick = (): void => {
      this.emitTimeUpdate()
      this.timeUpdateFrameId = requestAnimationFrame(tick)
    }

    this.timeUpdateFrameId = requestAnimationFrame(tick)
  }

  private stopTimeUpdateLoop(): void {
    if (this.timeUpdateFrameId !== null) {
      cancelAnimationFrame(this.timeUpdateFrameId)
      this.timeUpdateFrameId = null
    }
  }

  private emitTimeUpdate(): void {
    this.onTimeUpdate?.(this.getCurrentPlaybackTime(), this.getDuration())
  }

  private applyGain(): void {
    if (!this.gainNode || !this.audioContext) {
      return
    }

    const gainParam = this.gainNode.gain
    gainParam.cancelScheduledValues(this.audioContext.currentTime)
    gainParam.value = this.getTargetGain()
  }

  private initializeEqualizerFilters(context: AudioContext): void {
    this.equalizerFilters = EQ_BAND_DEFINITIONS.map((band) => {
      const filter = context.createBiquadFilter()
      filter.type = 'peaking'
      filter.frequency.value = band.frequencyHz
      filter.Q.value = EQ_FILTER_Q
      filter.gain.value = 0
      return filter
    })

    for (let index = 0; index < this.equalizerFilters.length - 1; index += 1) {
      this.equalizerFilters[index].connect(this.equalizerFilters[index + 1])
    }
  }

  private getEqualizerInputNode(): AudioNode {
    if (this.equalizerFilters.length === 0) {
      return this.analyserNode!
    }

    return this.equalizerFilters[0]
  }

  private getEqualizerOutputNode(): AudioNode {
    if (this.equalizerFilters.length === 0) {
      return this.analyserNode!
    }

    return this.equalizerFilters[this.equalizerFilters.length - 1]
  }

  private applyEqualizerGains(): void {
    this.equalizerFilters.forEach((filter, index) => {
      const configuredGain = this.equalizerGainsDb[index] ?? 0
      filter.gain.value = this.isEqualizerEnabled ? configuredGain : 0
    })
  }

  private clampTime(time: number): number {
    const duration = this.getDuration()
    return Math.max(0, Math.min(time, duration))
  }

  private clampVolume(volume: number): number {
    return Math.max(MIN_VOLUME, Math.min(volume, MAX_VOLUME))
  }

  private fail(contextMessage: string, error: unknown): never {
    const detail = error instanceof Error ? error.message : String(error)
    this.reportError(`${contextMessage}: ${detail}`)
    throw new Error(`${contextMessage}: ${detail}`)
  }

  private reportError(message: string): void {
    this.onError?.(message)
  }
}

/** Instancia ?nica del motor de audio del reproductor. */
export const audioEngine = new AudioEngine()
