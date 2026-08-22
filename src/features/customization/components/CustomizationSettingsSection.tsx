/** Sección de personalización con subnavegación interna. */

import { ALargeSmall, Image, Palette, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { MainMenuNavItem } from '@components/MainMenuNavItem'

import {
  CUSTOMIZATION_OPTIONS,
  type CustomizationDestination,
  type CustomizationSubSection,
} from '../types/customizationMenu'
import { BackgroundSettingsSection } from './BackgroundSettingsSection'
import { LyricsFontSizeSettingsSection } from './LyricsFontSizeSettingsSection'
import { LyricsFontsSettingsSection } from './LyricsFontsSettingsSection'
import { PlayerColorsSettingsSection } from './PlayerColorsSettingsSection'

const CUSTOMIZATION_ICONS: Record<CustomizationDestination, LucideIcon> = {
  background: Image,
  'player-colors': Palette,
  fonts: Type,
  'font-size': ALargeSmall,
}

interface CustomizationSettingsSectionProps {
  subSection: CustomizationSubSection
  onOpenSubSection: (section: CustomizationDestination) => void
}

/**
 * Lista las opciones de Personalización y renderiza la subsección activa.
 */
export function CustomizationSettingsSection({
  subSection,
  onOpenSubSection,
}: CustomizationSettingsSectionProps) {
  if (subSection === 'background') {
    return <BackgroundSettingsSection />
  }

  if (subSection === 'player-colors') {
    return <PlayerColorsSettingsSection />
  }

  if (subSection === 'fonts') {
    return <LyricsFontsSettingsSection />
  }

  if (subSection === 'font-size') {
    return <LyricsFontSizeSettingsSection />
  }

  return (
    <section
      className="main-menu-customization-section flex min-h-0 flex-1 flex-col"
      aria-label="Personalización"
    >
      <nav className="main-menu-screen__nav" aria-label="Opciones de personalización">
        {CUSTOMIZATION_OPTIONS.map((option) => {
          const Icon = CUSTOMIZATION_ICONS[option.id]

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
