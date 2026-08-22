/** Sección de calidad del audio con subnavegación interna. */

import { SlidersHorizontal, Volume2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { MainMenuNavItem } from '@components/MainMenuNavItem'

import {
  AUDIO_QUALITY_OPTIONS,
  type AudioQualityDestination,
  type AudioQualitySubSection,
} from '../types/audioQualityMenu'
import { EqualizerSettingsSection } from './EqualizerSettingsSection'
import { VolumeNormalizationSettingsSection } from './VolumeNormalizationSettingsSection'

const AUDIO_QUALITY_ICONS: Record<AudioQualityDestination, LucideIcon> = {
  equalizer: SlidersHorizontal,
  'volume-normalization': Volume2,
}

interface AudioQualitySettingsSectionProps {
  subSection: AudioQualitySubSection
  onOpenSubSection: (section: AudioQualityDestination) => void
}

/**
 * Lista las opciones de Calidad del audio y renderiza la subsección activa.
 */
export function AudioQualitySettingsSection({
  subSection,
  onOpenSubSection,
}: AudioQualitySettingsSectionProps) {
  if (subSection === 'equalizer') {
    return <EqualizerSettingsSection />
  }

  if (subSection === 'volume-normalization') {
    return <VolumeNormalizationSettingsSection />
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
              onClick={() => onOpenSubSection(option.id)}
            />
          )
        })}
      </nav>
    </section>
  )
}
