/** Contenedor de notificaciones toast del reproductor. */

import { memo } from 'react'

import { useToastStore } from '../../store/toastStore'

import { Toast } from './Toast'



/**

 * Muestra notificaciones toast apiladas en la esquina inferior derecha.

 */

export const ToastContainer = memo(function ToastContainer() {

  const toasts = useToastStore((state) => state.toasts)

  const removeToast = useToastStore((state) => state.removeToast)



  if (toasts.length === 0) {

    return null

  }



  return (

    <div

      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4"

      aria-live="polite"

      aria-relevant="additions"

    >

      {toasts.map((toast) => (

        <Toast

          key={toast.id}

          message={toast.message}

          variant={toast.type}

          duration={toast.duration}

          onClose={() => removeToast(toast.id)}

        />

      ))}

    </div>

  )

})

