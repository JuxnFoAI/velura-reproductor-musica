/** Sección de ajustes del menú principal con subnavegación interna. */

import { AudioLines, FolderOpen, Info, Palette } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useNavigationStore } from '../../store'
import { SETTINGS_OPTIONS, type SettingsDestination } from '../../types/settingsMenu'
import { MainMenuAboutSection } from './MainMenuAboutSection'
import { MainMenuAudioQualitySection } from './MainMenuAudioQualitySection'
import { MainMenuCustomizationSection } from './MainMenuCustomizationSection'
import { MainMenuMusicLibrarySection } from './MainMenuMusicLibrarySection'
import { MainMenuNavItem } from './MainMenuNavItem'

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
  const openSettingsSubSection = useNavigationStore((state) => state.openSettingsSubSection)

  if (settingsSubSection === 'music-library') {
    return <MainMenuMusicLibrarySection />
  }

  if (settingsSubSection === 'audio-quality') {
    return <MainMenuAudioQualitySection />
  }

  if (settingsSubSection === 'customization') {
    return <MainMenuCustomizationSection />
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
