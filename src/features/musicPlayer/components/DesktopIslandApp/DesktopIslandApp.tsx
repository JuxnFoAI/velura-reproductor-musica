/** Renderer mínimo de la isla dinámica como overlay de escritorio. */

import { useEffect } from 'react'
import { DynamicIsland } from '../DynamicIsland/DynamicIsland'
import { bindDesktopIslandRemote } from '../../lib/bindDesktopIslandRemote'

export function DesktopIslandApp() {
  useEffect(() => bindDesktopIslandRemote(), [])

  return (
    <div className="desktop-island-root">
      <DynamicIsland />
    </div>
  )
}
