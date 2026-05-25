import React from 'react'
import supplyChainData from '@/data/supply-chain.json'
import { SupplyChainPage } from '@/components/features/SupplyChainPage'
import type { SupplyChainLayer } from '@/types/supply-chain'

export default function Page(): React.ReactElement {
  return <SupplyChainPage layers={supplyChainData as SupplyChainLayer[]} />
}
