'use client'

import { useLayerFilter } from '@/hooks/useLayerFilter'
import { LayerNavigator } from '@/components/features/LayerNavigator'
import type { SupplyChainLayer } from '@/types/supply-chain'

interface SupplyChainPageProps {
  layers: SupplyChainLayer[]
}

export function SupplyChainPage({ layers }: SupplyChainPageProps): React.ReactElement {
  const { activeLayer, setActiveLayer } = useLayerFilter('all')

  return (
    <LayerNavigator
      layers={layers}
      activeLayer={activeLayer}
      onLayerChange={setActiveLayer}
    />
  )
}
