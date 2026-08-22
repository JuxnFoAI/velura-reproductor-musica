/** Sección de ajustes del menú principal con subnavegación interna. */

import { AudioLines, FolderOpen, Info, Palette } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { MainMenuNavItem } from '@components/MainMenuNavItem'
import { AudioQualitySettingsSection } from '@features/audioQuality'
import { CustomizationSettingsSection } from '@features/customization'

import { useNavigationStore } from '../../store'
import { SETTINGS_OPTIONS, type SettingsDestination } from '../../types/settingsMenu'
import { MainMenuAboutSection } from './MainMenuAboutSection'
import { MainMenuMusicLibrarySection } from './MainMenuMusicLibrarySection'

const SETTINGS_ICONS: Record<SettingsDestination, LucideIcon> = {
  'music-library': FolderOpen,
  'audio-quality': AudioLines,
  customization: Palette,
  about: Info,
}

/**
 * Lista las opciones de Ajustes y renderiza la subsección activa.
 */
export function MainMenuSettingsSection() {
  const settingsSubSection = useNavigationStore((state) => state.settingsSubSection)
  const audioQualitySubSection = useNavigationStore((state) => state.audioQualitySubSection)
  const customizationSubSection = useNavigationStore((state) => state.customizationSubSection)
  const openSettingsSubSection = useNavigationStore((state) => state.openSettingsSubSection)
  const openAudioQualitySubSection = useNavigationStore(
    (state) => state.openAudioQualitySubSection,
  )
  const openCustomizationSubSection = useNavigationStore(
    (state) => state.openCustomizationSubSection,
  )

  if (settingsSubSection === 'music-library') {
    return <MainMenuMusicLibrarySection />
  }

  if (settingsSubSection === 'audio-quality') {
    return (
      <AudioQualitySettingsSection
        subSection={audioQualitySubSection}
        onOpenSubSection={openAudioQualitySubSection}
      />
    )
  }

  if (settingsSubSection === 'customization') {
    return (
      <CustomizationSettingsSection
        subSection={customizationSubSection}
        onOpenSubSection={openCustomizationSubSection}
      />
    )
  }

  if (settingsSubSection === 'about') {
    return <MainMenuAboutSection />
  }

  return (
    <section className="main-menu-settings-section flex min-h-0 flex-1 flex-col" aria-label="Ajustes">
      <nav className="main-menu-screen__nav" aria-label="Opciones de ajustes">
        {SETTINGS_OPTIONS.map((option) => {
          const Icon = SETTINGS_ICONS[option.id]

          return (
            <MainMenuNavItem
              key={option.id}
              label={option.label}
              icon={<Icon size={20} />}
              onClick={() => openSettingsSubSection(option.id)}
            />
          )
        })}
      </nav>
    </section>
  )
}
