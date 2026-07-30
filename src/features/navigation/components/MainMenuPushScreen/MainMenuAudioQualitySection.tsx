/** Sección de calidad del audio dentro de Ajustes con subnavegación interna. */

import { SlidersHorizontal, Volume2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useNavigationStore } from '../../store'
import {
  AUDIO_QUALITY_OPTIONS,
  type AudioQualityDestination,
} from '../../types/audioQualityMenu'
import { MainMenuAudioQualityEqualizerSection } from './MainMenuAudioQualityEqualizerSection'
import { MainMenuAudioQualityVolumeNormalizationSection } from './MainMenuAudioQualityVolumeNormalizationSection'
import { MainMenuNavItem } from './MainMenuNavItem'

const AUDIO_QUALITY_ICONS: Record<AudioQualityDestination, LucideIcon> = {
  equalizer: SlidersHorizontal,
  'volume-normalization': Volume2,
}

/**
 * Lista las opciones de Calidad del audio y renderiza la subsección activa.
 */
export function MainMenuAudioQualitySection() {
  const audioQualitySubSection = useNavigationStore((state) => state.audioQualitySubSection)
  const openAudioQualitySubSection = useNavigationStore(
    (state) => state.openAudioQualitySubSection,
  )

  if (audioQualitySubSection === 'equalizer') {
    return <MainMenuAudioQualityEqualizerSection />
  }

  if (audioQualitySubSection === 'volume-normalization') {
    return <MainMenuAudioQualityVolumeNormalizationSection />
  }

  return (
    <section
      className="main-menu-audio-quality-section flex min-h-0 flex-1 flex-col"
      aria-label="Calidad del audio"
    >
      <nav className="main-menu-screen__nav" aria-label="Opciones de calidad del audio">
        {AUDIO_QUALITY_OPTIONS.map((option) => {
          const Icon = AUDIO_QUALITY_ICONS[option.id]

          return (
            <MainMenuNavItem
              key={option.id}
              label={option.label}
              icon={<Icon size={20} />}
              onClick={() => openAudioQualitySubSection(option.id)}
            />
          )
        })}
      </nav>
    </section>
  )
}
