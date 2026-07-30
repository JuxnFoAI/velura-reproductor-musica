/** Sección de personalización del menú de ajustes con subnavegación interna. */

import { ALargeSmall, Image, Palette, Pill, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useNavigationStore } from '../../store'
import {
  CUSTOMIZATION_OPTIONS,
  type CustomizationDestination,
} from '../../types/customizationMenu'
import { MainMenuCustomizationBackgroundSection } from './MainMenuCustomizationBackgroundSection'
import { MainMenuCustomizationDynamicIslandSection } from './MainMenuCustomizationDynamicIslandSection'
import { MainMenuCustomizationFontSizeSection } from './MainMenuCustomizationFontSizeSection'
import { MainMenuCustomizationFontsSection } from './MainMenuCustomizationFontsSection'
import { MainMenuCustomizationPlayerColorsSection } from './MainMenuCustomizationPlayerColorsSection'
import { MainMenuNavItem } from './MainMenuNavItem'

const CUSTOMIZATION_ICONS: Record<CustomizationDestination, LucideIcon> = {
  background: Image,
  'player-colors': Palette,
  'dynamic-island': Pill,
  fonts: Type,
  'font-size': ALargeSmall,
}

/**
 * Lista las opciones de Personalización y renderiza la subsección activa.
 */
export function MainMenuCustomizationSection() {
  const customizationSubSection = useNavigationStore((state) => state.customizationSubSection)
  const openCustomizationSubSection = useNavigationStore(
    (state) => state.openCustomizationSubSection,
  )

  if (customizationSubSection === 'background') {
    return <MainMenuCustomizationBackgroundSection />
  }

  if (customizationSubSection === 'player-colors') {
    return <MainMenuCustomizationPlayerColorsSection />
  }

  if (customizationSubSection === 'fonts') {
    return <MainMenuCustomizationFontsSection />
  }

  if (customizationSubSection === 'font-size') {
    return <MainMenuCustomizationFontSizeSection />
  }

  if (customizationSubSection === 'dynamic-island') {
    return <MainMenuCustomizationDynamicIslandSection />
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
              onClick={() => openCustomizationSubSection(option.id)}
            />
          )
        })}
      </nav>
    </section>
  )
}
