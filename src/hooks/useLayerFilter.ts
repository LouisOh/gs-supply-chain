'use client'

import { useState, useCallback } from 'react'
import type { FilterId } from '@/types/supply-chain'

interface UseLayerFilterReturn {
  activeLayer: FilterId
  setActiveLayer: (id: FilterId) => void
  isActive: (id: FilterId) => boolean
  reset: () => void
}

export function useLayerFilter(defaultLayer: FilterId = 'all'): UseLayerFilterReturn {
  const [activeLayer, setActiveLayerState] = useState<FilterId>(defaultLayer)

  const setActiveLayer = useCallback((id: FilterId): void => {
    setActiveLayerState(id)
  }, [])

  const isActive = useCallback(
    (id: FilterId): boolean => activeLayer === id,
    [activeLayer],
  )

  const reset = useCallback((): void => {
    setActiveLayerState('all')
  }, [])

  return { activeLayer, setActiveLayer, isActive, reset }
}
