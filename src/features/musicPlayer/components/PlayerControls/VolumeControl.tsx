/** Control de volumen con barra desplegable al pasar el cursor sobre el botón. */
import { memo, useCallback, useState, type ChangeEvent } from 'react'
import { Volume, Volume1, Volume2 } from 'lucide-react'
import { usePlayerStore } from '../../store/playerStore'

const LOW_VOLUME_THRESHOLD = 0.1
const MEDIUM_VOLUME_THRESHOLD = 0.5
const MIN_VOLUME = 0
const MAX_VOLUME = 1
const VOLUME_ICON_SIZE = 18

interface VolumeControlProps {
  disabled?: boolean
  className?: string
}

/**
 * Muestra un botón de volumen; al pasar el cursor se despliega el slider horizontal.
 * El icono refleja el nivel (0, 1 o 2 ondas) y, al ajustar, muestra el valor numérico.
 */
export const VolumeControl = memo(function VolumeControl({
  disabled = false,
  className,
}: VolumeControlProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const volume = usePlayerStore((state) => state.volume)
  const isMuted = usePlayerStore((state) => state.isMuted)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const toggleMute = usePlayerStore((state) => state.toggleMute)

  const VolumeIcon = resolveVolumeIcon(volume)
  const volumeDisplayValue = Math.round(volume * 100)
  const isControlDisabled = disabled
  const showVolumeValue = isExpanded

  const handleVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setVolume(Number(event.target.value))
    },
    [setVolume],
  )

  const handleMouseEnter = useCallback((): void => {
    if (!isControlDisabled) {
      setIsExpanded(true)
    }
  }, [isControlDisabled])

  const handleMouseLeave = useCallback((): void => {
    setIsExpanded(false)
  }, [])

  return (
    <div
      className={`volume-control flex items-center ${className ?? ''} ${
        isControlDisabled ? 'pointer-events-none opacity-40' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={toggleMute}
        disabled={isControlDisabled}
        aria-label={
          isMuted
            ? 'Activar sonido'
            : showVolumeValue
              ? `Silenciar. Volumen actual: ${volumeDisplayValue}`
              : 'Silenciar'
        }
        aria-disabled={isControlDisabled}
        aria-expanded={isExpanded}
        className="player-control-button volume-control__trigger shrink-0 disabled:cursor-not-allowed"
      >
        <VolumeButtonContent
          isMuted={isMuted}
          showVolumeValue={showVolumeValue}
          volumeDisplayValue={volumeDisplayValue}
          VolumeIcon={VolumeIcon}
        />
      </button>

      <div
        className={`volume-control__slider overflow-hidden transition-all duration-200 ease-out ${
          isExpanded ? 'volume-control__slider--expanded' : 'volume-control__slider--collapsed'
        }`}
        aria-hidden={!isExpanded}
      >
        <input
          type="range"
          min={MIN_VOLUME}
          max={MAX_VOLUME}
          step={0.01}
          value={volume}
          disabled={isControlDisabled}
          onChange={handleVolumeChange}
          tabIndex={isExpanded ? 0 : -1}
          aria-label="Volumen"
          aria-valuemin={MIN_VOLUME}
          aria-valuemax={MAX_VOLUME}
          aria-valuenow={volume}
          aria-valuetext={`${isMuted ? 0 : volumeDisplayValue}`}
          aria-disabled={isControlDisabled}
          className="volume-control__range h-1 w-24 cursor-pointer appearance-none rounded-full bg-[var(--player-surface)] disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
})

interface VolumeButtonContentProps {
  isMuted: boolean
  showVolumeValue: boolean
  volumeDisplayValue: number
  VolumeIcon: typeof Volume
}

/**
 * Muestra el icono o el número de volumen; si está silenciado, añade una raya diagonal.
 */
const VolumeButtonContent = memo(function VolumeButtonContent({
  isMuted,
  showVolumeValue,
  volumeDisplayValue,
  VolumeIcon,
}: VolumeButtonContentProps) {
  return (
    <span className="relative inline-flex items-center justify-center" aria-hidden="true">
      {showVolumeValue ? (
        <span className="text-xs font-medium tabular-nums">{volumeDisplayValue}</span>
      ) : (
        <VolumeIcon size={VOLUME_ICON_SIZE} />
      )}

      {isMuted ? (
        <span className="pointer-events-none absolute inset-[-2px] flex items-center justify-center">
          <span className="h-px w-[130%] rotate-[-45deg] rounded-full bg-current opacity-90" />
        </span>
      ) : null}
    </span>
  )
})

/**
 * Resuelve el icono según el nivel de volumen:
 * - ≤10%: altavoz sin ondas
 * - ≤50%: una onda
 * - >50%: dos ondas (máximo)
 */
function resolveVolumeIcon(volume: number) {
  if (volume <= LOW_VOLUME_THRESHOLD) {
    return Volume
  }

  if (volume <= MEDIUM_VOLUME_THRESHOLD) {
    return Volume1
  }

  return Volume2
}
