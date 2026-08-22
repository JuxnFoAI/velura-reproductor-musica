/** Metadatos de la pista activa en el panel push de información. */



import { memo, useCallback } from 'react'



import { formatFileSize, usePlayerStore } from '@features/musicPlayer'

import { useNavigationStore } from '../../store'

import { EditableTrackDetailRow } from './EditableTrackDetailRow'

import { TrackLyricsRow } from './TrackLyricsRow'







const NO_TRACK_LABEL = 'Sin pista seleccionada'







interface TrackDetailRowProps {



  label: string



  value: string



}







function TrackDetailRow({ label, value }: TrackDetailRowProps) {
  return (
    <div className="track-detail-row">
      <span className="track-detail-row__label">{label}</span>
      <span className="montserrat-regular text-base text-[var(--player-text)]">{value}</span>
    </div>
  )
}







/**



 * Muestra nombre, artista y letra de la canción en reproducción o seleccionada.



 */



export const PushScreenTrackDetails = memo(function PushScreenTrackDetails() {



  const currentTrack = usePlayerStore((state) => state.currentTrack)



  const updateTrackMetadata = usePlayerStore((state) => state.updateTrackMetadata)

  const attachTrackLyrics = usePlayerStore((state) => state.attachTrackLyrics)
  const openLyricsEditScreen = useNavigationStore((state) => state.openLyricsEditScreen)







  const trackTitle = currentTrack?.title ?? NO_TRACK_LABEL



  const trackArtist = currentTrack?.artist ?? NO_TRACK_LABEL



  const trackFileSize = currentTrack ? formatFileSize(currentTrack.fileSizeBytes) : NO_TRACK_LABEL



  const isEditable = Boolean(currentTrack)







  const handleTitleSave = useCallback(



    (nextTitle: string): void => {



      if (!currentTrack) {



        return



      }







      updateTrackMetadata(currentTrack.id, { title: nextTitle })



    },



    [currentTrack, updateTrackMetadata],



  )







  const handleArtistSave = useCallback(



    (nextArtist: string): void => {



      if (!currentTrack) {



        return



      }







      updateTrackMetadata(currentTrack.id, { artist: nextArtist })



    },



    [currentTrack, updateTrackMetadata],



  )



  const handleLyricsFileSelect = useCallback(

    (lyricsFile: File): void => {

      if (!currentTrack) {

        return

      }



      attachTrackLyrics(currentTrack.id, lyricsFile)

    },

    [attachTrackLyrics, currentTrack],

  )

  const handleEditLyrics = useCallback((): void => {
    if (!currentTrack?.lyricsRelativePath) {
      return
    }

    openLyricsEditScreen({
      trackId: currentTrack.id,
      lyricsRelativePath: currentTrack.lyricsRelativePath,
    })
  }, [currentTrack, openLyricsEditScreen])

  return (



    <section className="push-screen__details" aria-label="Detalles de la canción">



      <EditableTrackDetailRow



        label="Nombre:"



        value={trackTitle}



        isEditable={isEditable}



        editAriaLabel="Editar nombre de la canción"
        acceptAriaLabel="Aceptar nombre de la canción"
        cancelAriaLabel="Cancelar edición del nombre"



        onSave={handleTitleSave}



      />







      <EditableTrackDetailRow



        label="Artista:"



        value={trackArtist}



        isEditable={isEditable}



        editAriaLabel="Editar nombre del artista"
        acceptAriaLabel="Aceptar nombre del artista"
        cancelAriaLabel="Cancelar edición del artista"



        onSave={handleArtistSave}



      />







      <TrackDetailRow label="Tamaño:" value={trackFileSize} />



      <TrackLyricsRow

        lyricsRelativePath={currentTrack?.lyricsRelativePath}

        isEditable={isEditable}

        onLyricsFileSelect={handleLyricsFileSelect}

        onEditLyrics={handleEditLyrics}

      />



    </section>



  )



})


