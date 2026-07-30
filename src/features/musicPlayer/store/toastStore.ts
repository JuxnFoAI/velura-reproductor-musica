/** Store de notificaciones toast efímeras del reproductor. */

import { create } from 'zustand'



export type ToastType = 'success' | 'error' | 'remove'



export interface Toast {

  id: string

  type: ToastType

  message: string

  duration?: number

}



interface ToastState {

  toasts: Toast[]

  addToast: (toast: Omit<Toast, 'id'>) => void

  removeToast: (id: string) => void

}



export const useToastStore = create<ToastState>((set) => ({

  toasts: [],



  addToast: (toast) => {

    const id = crypto.randomUUID()

    const nextToast: Toast = { ...toast, id }



    set((state) => ({ toasts: [...state.toasts, nextToast] }))

  },



  removeToast: (id) => {

    set((state) => ({

      toasts: state.toasts.filter((entry) => entry.id !== id),

    }))

  },

}))



/** Acceso al store de toasts fuera de componentes React. */

export const toastStore = useToastStore

