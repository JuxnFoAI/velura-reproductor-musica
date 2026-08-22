/** Componente raíz de la aplicación. */
import { useState } from 'react'
import { IntroOverlay } from '@components/IntroOverlay'
import { MainMenuButton } from '@components/MainMenuButton'
import { NavigationMenuButton } from '@components/NavigationMenuButton'
import { MusicPlayer, TrackArtBackground } from '@features/musicPlayer'
import {
  CoverAdjustPushScreen,
  LyricsEditPushScreen,
  MainMenuPushScreen,
  SongInfoPushScreen,
} from '@features/navigation'
import { useAppBootstrap } from './hooks/useAppBootstrap'

function App() {
  const [showIntro, setShowIntro] = useState(true)

  useAppBootstrap()

  return (
    <div className="relative min-h-screen text-[var(--player-text)]">
      <div
        className={showIntro ? 'pointer-events-none opacity-0' : undefined}
        aria-hidden={showIntro}
      >
        <TrackArtBackground />
        <MainMenuButton />
        <NavigationMenuButton />
        <MainMenuPushScreen />
        <SongInfoPushScreen />
        <CoverAdjustPushScreen />
        <LyricsEditPushScreen />
        <MusicPlayer />
      </div>

      {showIntro ? <IntroOverlay onFinish={() => setShowIntro(false)} /> : null}
    </div>
  )
}

export default App
