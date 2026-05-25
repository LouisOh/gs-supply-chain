'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
import type { SupplyChainLayer, Company, FilterId, MarketPosition } from '@/types/supply-chain'
import { CompanyDrawer } from '@/components/features/CompanyDrawer'
import { CardGridSkeleton } from '@/components/ui/skeletons'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const LAYER_ICON: Record<string, string> = {
  T1: '⛏', T2: '⚗️', T3: '🔬', T4: '🏭', T5: '💡',
  T6: '🌐', T7: '🖥', T8: '🏢', T9: '⚡', T10: '🤖',
}

const POSITION_LABEL: Record<MarketPosition, string> = {
  dominant: 'Dominant', major: 'Major', emerging: 'Emerging',
  critical: 'Critical', private: 'Private',
}

const POSITION_STYLES: Record<MarketPosition, string> = {
  dominant: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
  major:    'bg-blue-500/10 text-blue-400 border border-blue-500/25',
  emerging: 'bg-purple-500/10 text-purple-400 border border-purple-500/25',
  critical: 'bg-red-500/10 text-red-400 border border-red-500/25',
  private:  'bg-zinc-700/30 text-zinc-500 border border-zinc-700/40',
}

// ─────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
}

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.18, ease: 'easeIn' } },
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function isCritical(company: Company): boolean {
  return company.tags.includes('critical')
}

function getShortLayerLabel(title: string): string {
  const afterDash = title.split('—')[1]
  if (!afterDash) return title
  return afterDash.trim().split(' ').slice(0, 3).join(' ')
}

function getPriceColor(pos: boolean | null): string {
  if (pos === true)  return 'text-emerald-400'
  if (pos === false) return 'text-red-400'
  return 'text-zinc-500'
}

// ─────────────────────────────────────────────────────────────
// NAV ITEM
// ─────────────────────────────────────────────────────────────
interface NavItemProps {
  layer: SupplyChainLayer
  isActive: boolean
  onClick: () => void
  variant: 'desktop' | 'mobile'
}

function NavItem({ layer, isActive, onClick, variant }: NavItemProps): React.ReactElement {
  const label    = getShortLayerLabel(layer.title)
  const icon     = LAYER_ICON[layer.id] ?? '○'
  const layerNum = layer.id.replace('T', '')

  if (variant === 'mobile') {
    return (
      <button
        onClick={onClick}
        aria-pressed={isActive}
        aria-label={`Filter by ${label}`}
        className={[
          'relative flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg',
          'font-mono text-xs font-medium tracking-wide whitespace-nowrap',
          'transition-all duration-200 min-h-[44px] min-w-[44px]',
          'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60',
          isActive
            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
            : 'bg-[#13171D] border-[#242B36] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300',
        ].join(' ')}
      >
        <span className="text-sm" aria-hidden="true">{icon}</span>
        <span>{label}</span>
        {isActive && (
          <motion.span
            layoutId="mobile-indicator"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full"
          />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`Filter by ${label}`}
      className={[
        'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
        'transition-all duration-200 min-h-[44px]',
        'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60',
        isActive
          ? 'bg-amber-500/10 border-amber-500/35 text-amber-300'
          : 'bg-transparent border-transparent text-zinc-500 hover:bg-[#13171D] hover:border-[#242B36] hover:text-zinc-300',
      ].join(' ')}
    >
      {isActive && (
        <motion.span
          layoutId="desktop-indicator"
          className="absolute left-0 top-2 bottom-2 w-0.5 bg-amber-400 rounded-full"
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      )}
      <span
        className={[
          'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center',
          'font-mono text-[10px] font-semibold border',
          isActive
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            : 'bg-[#1A1F28] border-[#242B36] text-zinc-600 group-hover:text-zinc-400',
        ].join(' ')}
        aria-hidden="true"
      >
        {layerNum}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-xs font-semibold tracking-wide truncate leading-4">{label}</span>
        <span className={[
          'text-[10px] font-mono truncate leading-3 mt-0.5',
          isActive ? 'text-amber-500/70' : 'text-zinc-600 group-hover:text-zinc-500',
        ].join(' ')}>
          {layer.companies.length} cos
        </span>
      </span>
      {isActive && (
        <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// ALL LAYERS BUTTON
// ─────────────────────────────────────────────────────────────
interface AllLayersBtnProps {
  isActive: boolean
  onClick: () => void
  variant: 'desktop' | 'mobile'
  totalCompanies: number
}

function AllLayersBtn({ isActive, onClick, variant, totalCompanies }: AllLayersBtnProps): React.ReactElement {
  if (variant === 'mobile') {
    return (
      <button
        onClick={onClick}
        aria-pressed={isActive}
        className={[
          'relative flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg',
          'font-mono text-xs font-medium tracking-wide whitespace-nowrap min-h-[44px]',
          'transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60',
          isActive
            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
            : 'bg-[#13171D] border-[#242B36] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300',
        ].join(' ')}
      >
        <span aria-hidden="true">◎</span>
        <span>All Layers</span>
        {isActive && (
          <motion.span
            layoutId="mobile-indicator"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full"
          />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={[
        'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
        'transition-all duration-200 min-h-[44px] border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60',
        isActive
          ? 'bg-amber-500/10 border-amber-500/35 text-amber-300'
          : 'bg-transparent border-transparent text-zinc-500 hover:bg-[#13171D] hover:border-[#242B36] hover:text-zinc-300',
      ].join(' ')}
    >
      {isActive && (
        <motion.span
          layoutId="desktop-indicator"
          className="absolute left-0 top-2 bottom-2 w-0.5 bg-amber-400 rounded-full"
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      )}
      <span
        className={[
          'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center',
          'font-mono text-[10px] font-semibold border',
          isActive
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            : 'bg-[#1A1F28] border-[#242B36] text-zinc-600 group-hover:text-zinc-400',
        ].join(' ')}
        aria-hidden="true"
      >
        ◎
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-xs font-semibold tracking-wide truncate leading-4">All Layers</span>
        <span className={[
          'text-[10px] font-mono truncate leading-3 mt-0.5',
          isActive ? 'text-amber-500/70' : 'text-zinc-600 group-hover:text-zinc-500',
        ].join(' ')}>
          {totalCompanies} cos
        </span>
      </span>
      {isActive && (
        <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPANY CARD
// ─────────────────────────────────────────────────────────────
interface CompanyCardProps {
  company: Company
  accentColor: string
  onOpen: (company: Company, accentColor: string) => void
}

function CompanyCard({ company, accentColor, onOpen }: CompanyCardProps): React.ReactElement {
  const critical = isCritical(company)

  const handleActivate = useCallback((): void => {
    onOpen(company, accentColor)
  }, [company, accentColor, onOpen])

  return (
    <motion.article
      variants={cardVariants}
      layout
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${company.name}`}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleActivate()
        }
      }}
      className={[
        'relative rounded-xl border p-4 transition-colors duration-200 cursor-pointer',
        'bg-[#13171D] hover:bg-[#1A1F28]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
        critical
          ? 'border-amber-500/30 hover:border-amber-500/50'
          : 'border-[#242B36] hover:border-[#2E3748]',
      ].join(' ')}
      style={critical ? { boxShadow: '0 0 18px rgba(245,158,11,0.12), 0 0 40px rgba(245,158,11,0.05)' } : undefined}
      whileHover={critical ? { boxShadow: '0 0 24px rgba(245,158,11,0.22), 0 0 48px rgba(245,158,11,0.08)' } : {}}
    >
      {/* Top accent line */}
      <span
        className="absolute top-0 left-4 right-4 h-px rounded-full opacity-60"
        style={{ background: accentColor }}
        aria-hidden="true"
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-zinc-500 tracking-wider mb-0.5">
            {company.ticker}
            {!company.priv && (
              <span className="ml-1 text-zinc-600">· {company.exchange}</span>
            )}
          </p>
          <h3 className="text-sm font-semibold text-zinc-100 leading-tight">{company.name}</h3>
        </div>

        {!company.priv ? (
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-mono font-semibold text-zinc-100 leading-tight">{company.price}</p>
            <p className={`text-[11px] font-mono mt-0.5 ${getPriceColor(company.pos)}`}>{company.chg}</p>
          </div>
        ) : (
          <span className="flex-shrink-0 text-[10px] font-mono px-2 py-1 rounded-md bg-zinc-800/60 text-zinc-600 border border-zinc-700/40">
            PRIVATE
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-[11.5px] text-zinc-500 leading-relaxed line-clamp-3 mb-3">
        {company.desc}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {company.tags.map((tag) => (
          <span
            key={tag}
            className={`text-[9px] font-mono font-medium uppercase tracking-widest px-2 py-0.5 rounded-md ${POSITION_STYLES[tag]}`}
          >
            {POSITION_LABEL[tag]}
          </span>
        ))}
      </div>

      {/* Market data footer */}
      {!company.priv && (
        <div className="mt-3 pt-2.5 border-t border-[#242B36] grid grid-cols-3 gap-2">
          {[
            { label: 'Mkt Cap', value: company.mktcap },
            { label: '52W Hi',  value: company.hi },
            { label: '52W Lo',  value: company.lo },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-0.5">{label}</p>
              <p className="text-[11px] font-mono text-zinc-300">{value}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2.5 text-[9px] font-mono text-zinc-700 tracking-widest">
        TAP FOR LIVE CHART →
      </p>
    </motion.article>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT: LayerNavigator
// ─────────────────────────────────────────────────────────────
interface LayerNavigatorProps {
  layers: SupplyChainLayer[]
  activeLayer: FilterId
  onLayerChange: (id: FilterId) => void
}

export function LayerNavigator({
  layers,
  activeLayer,
  onLayerChange,
}: LayerNavigatorProps): React.ReactElement {
  const prefersReducedMotion = useReducedMotion()
  const mobileScrollRef = useRef<HTMLDivElement>(null)

  const [drawerOpen,       setDrawerOpen]       = useState(false)
  const [selectedCompany,  setSelectedCompany]  = useState<Company | null>(null)
  const [selectedAccent,   setSelectedAccent]   = useState<string>('#F59E0B')
  const [selectedLayer,    setSelectedLayer]    = useState<Pick<SupplyChainLayer, 'id' | 'title'>>({ id: 'T1', title: '' })
  const [isTransitioning,  setIsTransitioning]  = useState(false)

  const handleLayerChange = useCallback((id: FilterId): void => {
    setIsTransitioning(true)
    requestAnimationFrame(() => { onLayerChange(id) })
  }, [onLayerChange])

  const handleOpenDrawer = useCallback((company: Company, accentColor: string): void => {
    setSelectedCompany(company)
    setSelectedAccent(accentColor)
    const parentLayer = layers.find((l) =>
      l.companies.some((c) => c.ticker === company.ticker && c.name === company.name),
    )
    if (parentLayer) {
      setSelectedLayer({ id: parentLayer.id, title: parentLayer.title })
    }
    setDrawerOpen(true)
  }, [layers])

  const totalCompanies = layers.reduce((acc, l) => acc + l.companies.length, 0)

  const displayedLayer =
    activeLayer === 'all'
      ? null
      : layers.find((l) => l.id === activeLayer) ?? null

  const displayedCompanies: Array<{ company: Company; accentColor: string }> =
    displayedLayer
      ? displayedLayer.companies.map((c) => ({ company: c, accentColor: displayedLayer.accentColor }))
      : layers.flatMap((l) => l.companies.map((c) => ({ company: c, accentColor: l.accentColor })))

  useEffect(() => {
    if (!mobileScrollRef.current) return
    const active = mobileScrollRef.current.querySelector('[aria-pressed="true"]')
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeLayer])

  const resolvedContainerVariants: Variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.15 } }, exit: { opacity: 0, transition: { duration: 0.1 } } }
    : containerVariants

  const resolvedCardVariants: Variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : cardVariants

  return (
    <>
      <div className="flex flex-col md:flex-row gap-0 min-h-screen bg-[#0B0E11]">

        {/* MOBILE nav */}
        <nav
          aria-label="Supply chain layer filter"
          className="md:hidden sticky top-0 z-30 bg-[#0B0E11]/95 backdrop-blur-sm border-b border-[#242B36] px-3 py-2.5"
        >
          <div ref={mobileScrollRef} className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5" role="list">
            <div role="listitem">
              <AllLayersBtn isActive={activeLayer === 'all'} onClick={() => handleLayerChange('all')} variant="mobile" totalCompanies={totalCompanies} />
            </div>
            {layers.map((layer) => (
              <div key={layer.id} role="listitem">
                <NavItem layer={layer} isActive={activeLayer === layer.id} onClick={() => handleLayerChange(layer.id)} variant="mobile" />
              </div>
            ))}
          </div>
        </nav>

        {/* DESKTOP sidebar */}
        <nav
          aria-label="Supply chain layer filter"
          className="hidden md:flex flex-col w-56 lg:w-60 flex-shrink-0 sticky top-0 h-screen overflow-y-auto bg-[#0B0E11] border-r border-[#242B36] py-5 px-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
        >
          <div className="px-2 mb-5">
            <p className="text-[9px] font-mono text-amber-500/70 tracking-[0.3em] uppercase mb-1">GS Research</p>
            <h2 className="text-xs font-semibold text-zinc-200 leading-snug">AI Supply Chain</h2>
            <p className="text-[10px] font-mono text-zinc-600 mt-0.5">{totalCompanies} companies · 10 layers</p>
          </div>
          <div className="h-px bg-[#242B36] mx-2 mb-3" />
          <AllLayersBtn isActive={activeLayer === 'all'} onClick={() => handleLayerChange('all')} variant="desktop" totalCompanies={totalCompanies} />
          <div className="mt-1 flex flex-col gap-0.5" role="list">
            {layers.map((layer) => (
              <div key={layer.id} role="listitem">
                <NavItem layer={layer} isActive={activeLayer === layer.id} onClick={() => handleLayerChange(layer.id)} variant="desktop" />
              </div>
            ))}
          </div>
          <div className="mt-auto pt-5 px-2">
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-2">Market Position</p>
            <div className="flex flex-col gap-1.5">
              {(Object.entries(POSITION_LABEL) as Array<[MarketPosition, string]>).map(([pos, label]) => (
                <div key={pos} className="flex items-center gap-2">
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${POSITION_STYLES[pos]}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 h-px bg-[#242B36]" />
            <p className="text-[9px] font-mono text-zinc-700 mt-2">⚠ Amber glow = critical bottleneck</p>
            <p className="text-[9px] font-mono text-zinc-700 mt-1">↗ Tap any card for live chart</p>
          </div>
        </nav>

        {/* CONTENT */}
        <main className="flex-1 min-w-0 px-3 py-4 md:px-6 md:py-6">
          <div className="mb-5">
            <AnimatePresence mode="wait">
              <motion.div key={activeLayer} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.22 }}>
                {displayedLayer ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: displayedLayer.accentColor }} aria-hidden="true" />
                      <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">{displayedLayer.id} · {displayedLayer.companies.length} companies</p>
                    </div>
                    <h1 className="text-lg font-bold text-zinc-100 leading-snug">{displayedLayer.title}</h1>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{displayedLayer.subtitle}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase mb-1">All Layers · {totalCompanies} companies</p>
                    <h1 className="text-lg font-bold text-zinc-100 leading-snug">Global AI Supply Chain</h1>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">Raw Materials → Cloud Platforms · 10 distinct layers</p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait" onExitComplete={() => setIsTransitioning(false)}>
            {isTransitioning ? (
              <motion.div key={`skeleton-${activeLayer}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                <CardGridSkeleton count={Math.min(displayedCompanies.length || 12, 12)} />
              </motion.div>
            ) : (
              <motion.div
                key={activeLayer}
                variants={resolvedContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3"
              >
                {displayedCompanies.map(({ company, accentColor }, i) => (
                  <motion.div key={`${company.ticker}-${i}`} variants={resolvedCardVariants}>
                    <CompanyCard company={company} accentColor={accentColor} onOpen={handleOpenDrawer} />
                  </motion.div>
                ))}
                {displayedCompanies.length === 0 && (
                  <motion.div variants={resolvedCardVariants} className="col-span-full flex flex-col items-center justify-center py-24 text-zinc-600">
                    <span className="text-4xl mb-3" aria-hidden="true">◎</span>
                    <p className="font-mono text-sm">No companies in this layer</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <CompanyDrawer
        company={selectedCompany}
        accentColor={selectedAccent}
        layer={selectedLayer}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  )
}
