// ─────────────────────────────────────────────
// Supply Chain — Canonical TypeScript Types
// Derived from CLAUDE.md + src/data/supply-chain.json
// ─────────────────────────────────────────────

export type MarketPosition = 'dominant' | 'major' | 'emerging' | 'critical' | 'private'

export interface Company {
  name: string
  ticker: string
  exchange: string
  price: string
  chg: string
  pos: boolean | null
  hi: string
  lo: string
  mktcap: string
  priv: boolean
  tvSymbol: string | null
  tags: MarketPosition[]
  roles: string[]
  desc: string
}

export interface SupplyChainLayer {
  id: string
  accentColor: string
  title: string
  subtitle: string
  companies: Company[]
}

export type FilterId = string | 'all'
