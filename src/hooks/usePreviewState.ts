/** Estado local de vista previa que se reinicia cuando cambia el valor aplicado. */

import { useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Mantiene un borrador editable que vuelve al valor aplicado cuando este cambia externamente.
 */
export function usePreviewState<T>(appliedValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [previewValue, setPreviewValue] = useState(appliedValue)
  const [previousAppliedValue, setPreviousAppliedValue] = useState(appliedValue)

  if (previousAppliedValue !== appliedValue) {
    setPreviousAppliedValue(appliedValue)
    setPreviewValue(appliedValue)
  }

  return [previewValue, setPreviewValue]
}
