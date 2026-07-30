/** Banner que solicita interacción del usuario para desbloquear el audio. */
import { memo } from 'react'
import { Volume2 } from 'lucide-react'
import { usePlayerStore } from '../../store/playerStore'

/**
 * Informa cuando el navegador bloquea el AudioContext y permite reanudarlo.
 */
export const AudioBlockedBanner = memo(function AudioBlockedBanner() {
  const isAudioBlocked = usePlayerStore((state) => state.isAudioBlocked)
  const resumeAudio = usePlayerStore((state) => state.resumeAudio)

  if (!isAudioBlocked) {
    return null
  }

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-xl border border-[var(--player-accent)] bg-[var(--player-surface)] px-4 py-3"
    >
      <p className="text-sm text-[var(--player-text)]">
        El navegador bloqueó la reproducción de audio. Haz clic para activar el sonido.
      </p>
      <button
        type="button"
        onClick={() => void resumeAudio()}
        aria-label="Activar reproducción de audio"
        className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--player-accent)] px-4 py-2 text-sm font-medium text-[var(--player-background)] transition-opacity hover:opacity-90"
      >
        <Volume2 size={16} aria-hidden="true" />
        Activar audio
      </button>
    </div>
  )
})
