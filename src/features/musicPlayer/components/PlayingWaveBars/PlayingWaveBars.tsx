/** Barras verticales animadas que indican reproducción activa. */

import { memo } from 'react'



const BAR_DELAYS_BY_COUNT: Record<3 | 5, readonly string[]> = {

  3: ['0s', '0.15s', '0.3s'],

  5: ['0s', '0.15s', '0.3s', '0.45s', '0.6s'],

}



type WaveBarVariant = 'accent' | 'white'



interface PlayingWaveBarsProps {

  className?: string

  barCount?: 3 | 5

  variant?: WaveBarVariant

}



const VARIANT_CLASSES: Record<WaveBarVariant, string> = {

  accent: 'wave-bar--accent',

  white: 'wave-bar--white',

}



/**

 * Muestra barras en movimiento mientras la pista se reproduce.

 */

export const PlayingWaveBars = memo(function PlayingWaveBars({

  className,

  barCount = 3,

  variant = 'white',

}: PlayingWaveBarsProps) {

  const delays = BAR_DELAYS_BY_COUNT[barCount]

  const barClassName = VARIANT_CLASSES[variant]



  return (

    <span

      className={`flex items-end gap-0.5 ${className ?? ''}`}

      aria-hidden="true"

    >

      {delays.map((delay, index) => (

        <span

          key={`playing-bar-${index}`}

          className={`wave-bar ${barClassName}`}

          style={{ animationDelay: delay }}

        />

      ))}

    </span>

  )

})

