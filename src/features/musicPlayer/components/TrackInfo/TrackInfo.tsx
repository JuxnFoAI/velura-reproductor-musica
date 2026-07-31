/** Componente presentacional con metadatos visuales de la pista activa. */

import { memo, useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { usePlayerStore } from '../../store/playerStore'

import { LyricsPanel } from '../LyricsPanel'

import { PlayingWaveBars } from '../PlayingWaveBars'



interface TrackInfoProps {

  className?: string

  /** Desactiva animaciones y efectos visuales en la portada. */

  plainCover?: boolean

}



const COVER_WIDTH_CLASS = 'track-info__column w-[var(--lyrics-cover-size)]'
const COVER_SIZE_CLASS = 'track-info__cover h-[var(--lyrics-cover-size)] w-[var(--lyrics-cover-size)]'



const LYRICS_SLIDE_CENTERED: CSSProperties = {

  left: '50%',

  transform: 'translateX(-50%)',

}



const LYRICS_SLIDE_LEFT: CSSProperties = {

  left: 0,

  transform: 'translateX(0)',

}



/** Devuelve left + translateX según el modo letra (toggle). */

function getLyricsSlideStyle(isLyricsVisible: boolean): CSSProperties {

  return isLyricsVisible ? LYRICS_SLIDE_LEFT : LYRICS_SLIDE_CENTERED

}



interface AnimatedTrackInfoShellProps {

  isLyricsVisible: boolean

  children: ReactNode

}



/**

 * Desplaza portada y metadatos con left + translateX para evitar saltos de align-items.

 */

const AnimatedTrackInfoShell = memo(function AnimatedTrackInfoShell({

  isLyricsVisible,

  children,

}: AnimatedTrackInfoShellProps) {

  const containerRef = useRef<HTMLDivElement>(null)

  const contentRef = useRef<HTMLDivElement>(null)

  const [contentHeightPx, setContentHeightPx] = useState(0)



  const updateContentHeight = useCallback((): void => {

    const content = contentRef.current



    if (!content) {

      return

    }



    setContentHeightPx(content.offsetHeight)

  }, [])



  useLayoutEffect(() => {

    updateContentHeight()



    const content = contentRef.current



    if (!content) {

      return

    }



    const resizeObserver = new ResizeObserver(updateContentHeight)

    resizeObserver.observe(content)



    return () => {

      resizeObserver.disconnect()

    }

  }, [updateContentHeight, children])



  return (

    <div

      ref={containerRef}

      className="relative w-full overflow-visible"

      style={{ height: contentHeightPx > 0 ? contentHeightPx : undefined }}

    >

      <div

        ref={contentRef}

        className="track-info-slide absolute top-0"

        style={getLyricsSlideStyle(isLyricsVisible)}

      >

        {children}

      </div>

    </div>

  )

})



interface TrackMetadataProps {

  title: string

  artist: string

  isLyricsVisible: boolean

}



/**

 * Título y artista centrados por defecto; en modo letra se deslizan a la izquierda con left + translateX.

 */

const TrackMetadata = memo(function TrackMetadata({

  title,

  artist,

  isLyricsVisible,

}: TrackMetadataProps) {

  const titleSlideStyle = getLyricsSlideStyle(isLyricsVisible)

  const artistSlideStyle = getLyricsSlideStyle(isLyricsVisible)



  return (

    <div className="relative w-full min-w-0">

      <h1

        className="track-info-slide bebas-neue-regular absolute top-0 w-max max-w-full truncate text-xl text-[var(--player-text)] md:text-2xl"

        style={titleSlideStyle}

      >

        {title}

      </h1>

      <p

        className="track-info-slide montserrat-regular absolute top-7 w-max max-w-full truncate text-base text-[var(--player-secondary)] md:top-8 md:text-lg"

        style={artistSlideStyle}

      >

        {artist}

      </p>

      <div className="invisible pointer-events-none" aria-hidden="true">

        <h1 className="bebas-neue-regular text-xl md:text-2xl">{title}</h1>

        <p className="montserrat-regular mt-1 text-base md:text-lg">{artist}</p>

      </div>

    </div>

  )

})



interface TrackInfoContentProps {

  isLyricsVisible: boolean

  plainCover?: boolean

  coverUrl?: string

  title: string

  artist: string

}



/**

 * Agrupa portada y metadatos con ancho fijo de la portada para conservar la alineación al deslizar.

 */

const TrackInfoContent = memo(function TrackInfoContent({

  isLyricsVisible,

  plainCover = false,

  coverUrl,

  title,

  artist,

}: TrackInfoContentProps) {

  return (

    <div className={`flex ${COVER_WIDTH_CLASS} flex-col gap-4`}>

      <TrackCover coverUrl={coverUrl} title={title} plainCover={plainCover} />

      <TrackMetadata title={title} artist={artist} isLyricsVisible={isLyricsVisible} />

    </div>

  )

})



/**

 * Muestra portada, título y artista de la pista actual.

 */

export const TrackInfo = memo(function TrackInfo({

  className,

  plainCover = false,

}: TrackInfoProps) {

  const currentTrack = usePlayerStore((state) => state.currentTrack)

  const status = usePlayerStore((state) => state.status)

  const isLyricsVisible = usePlayerStore((state) => state.isLyricsVisible)

  const isInitialLoad = status === 'loading' && !currentTrack

  const track = currentTrack



  if (isInitialLoad) {

    return (

      <TrackInfoSkeleton

        className={className}

        plainCover={plainCover}

        isLyricsVisible={isLyricsVisible}

      />

    )

  }



  if (!track) {

    return <TrackInfoEmpty className={className} isLyricsVisible={isLyricsVisible} />

  }



  const articleClassName = [

    'track-info',

    'relative flex w-full flex-col overflow-visible',

    isLyricsVisible ? 'track-info--lyrics-visible' : '',

    className ?? '',

  ]

    .filter(Boolean)

    .join(' ')



  return (

    <article className={articleClassName}>

      <AnimatedTrackInfoShell isLyricsVisible={isLyricsVisible}>

        <TrackInfoContent

          isLyricsVisible={isLyricsVisible}

          plainCover={plainCover}

          coverUrl={track.coverUrl}

          title={track.title}

          artist={track.artist}

        />

      </AnimatedTrackInfoShell>

      <LyricsPanel />

    </article>

  )

})



const DEFAULT_COVER_SIZE_CLASS = 'track-info__cover h-[var(--lyrics-cover-size)] w-[var(--lyrics-cover-size)]'



interface TrackCoverProps {

  coverUrl?: string

  title: string

  plainCover?: boolean

  sizeClass?: string

}



export const TrackCover = memo(function TrackCover({

  coverUrl,

  title,

  plainCover = false,

  sizeClass = DEFAULT_COVER_SIZE_CLASS,

}: TrackCoverProps) {

  if (coverUrl) {

    return (

      <img

        src={coverUrl}

        alt={`Portada de ${title}`}

        decoding="async"

        className={

          plainCover

            ? `${sizeClass} rounded-2xl object-cover`

            : `${sizeClass} rounded-2xl object-cover shadow-lg`

        }

      />

    )

  }



  if (plainCover) {

    return <CoverPlaceholder sizeClass={sizeClass} />

  }



  return (

    <div

      aria-hidden="true"

      className={`flex ${sizeClass} items-end justify-center overflow-hidden rounded-2xl bg-[var(--player-surface)] px-4 pb-5 shadow-lg ring-1 ring-[var(--player-primary)] ring-opacity-20`}

    >

      <PlayingWaveBars barCount={5} variant="accent" className="h-1/4" />

    </div>

  )

})



const CoverPlaceholder = memo(function CoverPlaceholder({

  sizeClass = DEFAULT_COVER_SIZE_CLASS,

}: {

  sizeClass?: string

}) {

  return (

    <div

      className={`flex ${sizeClass} items-center justify-center rounded-2xl bg-[var(--player-cover-white)] ring-1 ring-[var(--player-primary)] ring-opacity-10`}

    >

      <span className="text-4xl text-black">♪</span>

    </div>

  )

})



interface TrackInfoEmptyProps {

  className?: string

  isLyricsVisible?: boolean

}



const TrackInfoEmpty = memo(function TrackInfoEmpty({

  className,

  isLyricsVisible = false,

}: TrackInfoEmptyProps) {

  return (

    <div className={`flex w-full flex-col ${className ?? ''}`}>

      <AnimatedTrackInfoShell isLyricsVisible={isLyricsVisible}>

        <div className={`flex ${COVER_WIDTH_CLASS} flex-col items-start`}>

          <CoverPlaceholder />

        </div>

      </AnimatedTrackInfoShell>

    </div>

  )

})



interface TrackInfoSkeletonProps {

  className?: string

  plainCover?: boolean

  isLyricsVisible?: boolean

}



const TrackInfoSkeleton = memo(function TrackInfoSkeleton({

  className,

  plainCover = false,

  isLyricsVisible = false,

}: TrackInfoSkeletonProps) {

  const coverSkeletonClass = plainCover

    ? `${COVER_SIZE_CLASS} rounded-2xl bg-[var(--player-surface)]`

    : `track-info-skeleton ${COVER_SIZE_CLASS} rounded-2xl bg-[var(--player-surface)]`

  const metadataSlideStyle = getLyricsSlideStyle(isLyricsVisible)



  return (

    <div

      className={`flex w-full flex-col ${className ?? ''}`}

      aria-busy="true"

      aria-label="Cargando información de la pista"

    >

      <AnimatedTrackInfoShell isLyricsVisible={isLyricsVisible}>

        <div className={`flex ${COVER_WIDTH_CLASS} flex-col gap-4`}>

          <div className={coverSkeletonClass} />



          <div className="relative w-full min-w-0">

            <div

              className="track-info-slide track-info-skeleton absolute top-0 h-7 w-2/3 rounded-md bg-[var(--player-surface)]"

              style={metadataSlideStyle}

            />

            <div

              className="track-info-slide track-info-skeleton absolute top-9 h-5 w-1/2 rounded-md bg-[var(--player-surface)]"

              style={metadataSlideStyle}

            />

            <div className="invisible flex flex-col gap-2" aria-hidden="true">

              <div className="h-7 w-2/3" />

              <div className="h-5 w-1/2" />

            </div>

          </div>

        </div>

      </AnimatedTrackInfoShell>

    </div>

  )

})

