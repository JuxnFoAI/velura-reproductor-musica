/** Punto de entrada de la aplicación React. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { DesktopIslandApp } from '@features/musicPlayer'
import { isDesktopIslandWindow } from '@lib/desktopIslandWindow'
import './styles/localFonts.css'
import './styles/globals.css'

const isIslandWindow = isDesktopIslandWindow()

if (isIslandWindow) {
  document.documentElement.classList.add('desktop-island-window')
  document.title = ''
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isIslandWindow ? <DesktopIslandApp /> : <App />}
  </StrictMode>,
)
