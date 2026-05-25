'use client'

import { useState, useCallback, useId, useEffect, useRef, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useQuote }                 from '@/hooks/useQuote'
import { Shimmer, DrawerSkeleton, ChartSkeleton } from '@/components/ui/skeletons'
import { SmartInsight }             from '@/components/features/SmartInsight'
import {
  ChartErrorBoundary,
  ChartUnavailableBanner,
} from '@/components/ui/ChartErrorBoundary'
import type { Company, MarketPosition, SupplyChainLayer } from '@/types/supply-chain'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

/** How long to wait for the TradingView iframe onLoad before
 *  treating it as a timeout and showing the unavailable state. */
const IFRAME_LOAD_TIMEOUT_MS = 12_000

const POSITION_STYLES: Record<MarketPosition, string> = {
  dominant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  major:    'bg-blue-500/10    text-blue-400    border-blue-500/30    hover:bg-blue-500/20',
  emerging: 'bg-purple-500/10  text-purple-400  border-purple-500/30  hover:bg-purple-500/20',
  critical: 'bg-red-500/10     text-red-400     border-red-500/30     hover:bg-red-500/20',
  private:  'bg-zinc-700/30    text-zinc-500    border-zinc-700/40    hover:bg-zinc-700/40',
}

const POSITION_LABEL: Record<MarketPosition, string> = {
  dominant: 'Dominant',
  major:    'Major Player',
  emerging: 'Emerging',
  critical: 'Critical Bottleneck',
  private:  'Private',
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatVolume(raw: string): string {
  const n = parseInt(raw.replace(/,/g, ''), 10)
  if (isNaN(n))          return raw
  if (n >= 1_000_000)   return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)       return `${(n / 1_000).toFixed(1)}K`
  return raw
}

function formatPrice(n: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ─────────────────────────────────────────────────────────────
// LIVE PRICE BLOCK
// Shows: loading shimmer → live quote → graceful error fallback
// with ChartUnavailableBanner for soft API / market-closed errors
// ─────────────────────────────────────────────────────────────

interface LivePriceBlockProps {
  company: Company
}

function LivePriceBlock({ company }: LivePriceBlockProps): React.ReactElement {
  const { quote, status, error, isStale, refetch } = useQuote(
    company.tvSymbol,
    !company.priv,
  )

  const isLoading = status === 'loading'
  const isError   = status === 'error'
  const hasData   = status === 'success' && quote !== null

  // Detect market-closed from error message
  const isMarketClosed = isError && (
    error?.toLowerCase().includes('market') === true ||
    error?.toLowerCase().includes('closed') === true ||
    error?.toLowerCase().includes('trading hours') === true
  )

  const bannerReason: ChartUnavailableBannerProps['reason'] =
    isMarketClosed ? 'market_closed' : 'api_error'

  return (
    <div className="px-5 pt-4 pb-3 border-b border-[#242B36]">

      {/* ── Company header row ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase mb-0.5">
            {company.ticker}
            {!company.priv && (
              <span className="ml-1.5 text-zinc-700">· {company.exchange}</span>
            )}
          </p>
          <h2 className="text-base font-bold text-zinc-100 leading-snug">
            {company.name}
          </h2>
        </div>

        {/* Refresh button — only for public, non-loading */}
        {!company.priv && (
          <button
            onClick={refetch}
            disabled={isLoading}
            aria-label="Refresh quote"
            className="
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
              border border-[#242B36] bg-[#1A1F28]
              text-zinc-500 hover:text-amber-400 hover:border-amber-500/40
              transition-colors duration-150
              disabled:opacity-40 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40
            "
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
              animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={isLoading
                ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
                : {}}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </motion.svg>
          </button>
        )}
      </div>

      {/* Private badge */}
      {company.priv && (
        <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-zinc-800/60 text-zinc-500 border border-zinc-700/40">
          PRIVATE — NOT PUBLICLY LISTED
        </span>
      )}

      {/* ── Loading shimmer ── */}
      {!company.priv && isLoading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-3 mb-1">
            <Shimmer className="h-10 w-36" rounded="rounded-lg" />
            <div className="flex flex-col gap-1.5 pb-0.5">
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-3 w-12" />
            </div>
          </div>
          <div className="flex gap-3">
            {[56, 48, 48, 44].map((w, i) => (
              <Shimmer key={i} className="h-3" style={{ width: w }} />
            ))}
          </div>
          <Shimmer className="mt-1 h-2 w-40" />
        </div>
      )}

      {/* ── Soft error: API unavailable / market closed ── */}
      <AnimatePresence>
        {!company.priv && isError && (
          <ChartUnavailableBanner
            reason={bannerReason}
            lastClosePrice={company.price}
            ticker={company.ticker}
            onRetry={refetch}
          />
        )}
      </AnimatePresence>

      {/* ── Live quote data ── */}
      {!company.priv && hasData && quote !== null && (
        <AnimatePresence mode="wait">
          <motion.div
            key={quote.price}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-bold font-mono text-zinc-50 leading-none tracking-tight">
                ${formatPrice(quote.price)}
              </span>
              <div className="flex flex-col pb-0.5">
                <span className={`text-sm font-mono font-semibold leading-none ${
                  quote.isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {quote.isPositive ? '+' : ''}{formatPrice(quote.change)}
                </span>
                <span className={`text-[11px] font-mono mt-0.5 ${
                  quote.isPositive ? 'text-emerald-500/70' : 'text-red-500/70'
                }`}>
                  {quote.changePercent}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { label: 'Open', value: `$${quote.open}` },
                { label: 'High', value: `$${quote.high}` },
                { label: 'Low',  value: `$${quote.low}`  },
                { label: 'Vol',  value: formatVolume(quote.volume) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                    {label}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">{value}</span>
                </div>
              ))}
              {isStale && (
                <span className="text-[9px] font-mono text-amber-500/50 ml-auto">
                  ● stale
                </span>
              )}
            </div>

            <p className="text-[9px] font-mono text-zinc-700 mt-1.5">
              As of {quote.latestTradingDay} · Alpha Vantage
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROLE TAGS
// ─────────────────────────────────────────────────────────────

interface RoleTagsProps {
  roles: string[]
  tags:  MarketPosition[]
}

function RoleTags({ roles, tags }: RoleTagsProps): React.ReactElement {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const handleTag = useCallback((role: string): void => {
    setActiveTag((prev) => (prev === role ? null : role))
  }, [])

  return (
    <div className="px-5 py-4 border-t border-[#242B36]">
      <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2.5">
        Core Characteristics
      </p>

      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`
              text-[9px] font-mono font-medium uppercase tracking-widest
              px-2 py-1 rounded-md border
              ${POSITION_STYLES[tag]}
            `}
          >
            {POSITION_LABEL[tag]}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {roles.map((role) => {
          const isActive = activeTag === role
          return (
            <motion.button
              key={role}
              onClick={() => handleTag(role)}
              aria-pressed={isActive}
              whileTap={{ scale: 0.95 }}
              className={`
                text-[10px] font-mono tracking-wide
                px-2.5 py-1.5 rounded-lg border
                transition-all duration-150 min-h-[32px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                ${isActive
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                  : 'bg-[#1A1F28] border-[#242B36] text-zinc-400 hover:border-[#2E3748] hover:text-zinc-200'
                }
              `}
            >
              {isActive && (
                <span className="mr-1 text-amber-400" aria-hidden="true">✓</span>
              )}
              {role}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {activeTag !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mt-2.5 text-[11px] font-mono text-amber-400/70 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
              ◎ <strong>{activeTag}</strong>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CHART WITH SKELETON + ERROR BOUNDARY + TIMEOUT GUARD
//
// Failure modes handled:
//   A. JS throw inside render  →  ChartErrorBoundary catches it
//   B. iframe never fires onLoad within IFRAME_LOAD_TIMEOUT_MS
//      → ChartUnavailableBanner with reason "timeout"
//   C. iframe onError fires    →  same as B
// ─────────────────────────────────────────────────────────────

type ChartUnavailableBannerProps = import('@/components/ui/ChartErrorBoundary').ChartUnavailableBannerProps

interface ChartWithSkeletonProps {
  tvSymbol:       string
  companyName:    string
  lastClosePrice: string
  ticker:         string
}

// TV overrides are static — computed once at module level, never on render.
// Encoding is expensive (JSON.stringify + encodeURIComponent) so we hoist it
// to the module scope so it runs exactly once per module load.
const TV_OVERRIDES = encodeURIComponent(JSON.stringify({
  'paneProperties.background':               '#0B0E11',
  'paneProperties.backgroundType':           'solid',
  'paneProperties.vertGridProperties.color': '#13171D',
  'paneProperties.horzGridProperties.color': '#13171D',
  'mainSeriesProperties.candleStyle.upColor':         '#22C55E',
  'mainSeriesProperties.candleStyle.downColor':       '#EF4444',
  'mainSeriesProperties.candleStyle.borderUpColor':   '#22C55E',
  'mainSeriesProperties.candleStyle.borderDownColor': '#EF4444',
  'mainSeriesProperties.candleStyle.wickUpColor':     '#22C55E',
  'mainSeriesProperties.candleStyle.wickDownColor':   '#EF4444',
}))

/** Build the TradingView widget URL for a given symbol. */
function buildChartSrc(tvSymbol: string): string {
  return [
    'https://www.tradingview.com/widgetembed/',
    `?frameElementId=tv_${tvSymbol.replace(/[^a-zA-Z0-9]/g, '_')}`,
    `&symbol=${encodeURIComponent(tvSymbol)}`,
    '&interval=D',
    '&theme=dark',
    '&style=1',
    '&timezone=exchange',
    '&locale=en',
    '&hidesidetoolbar=0',
    '&hidetoptoolbar=0',
    '&allow_symbol_change=0',
    '&saveimage=0',
    '&toolbarbg=0B0E11',
    `&overrides=${TV_OVERRIDES}`,
  ].join('')
}

// memo() prevents re-renders when the parent re-renders but props are stable.
// tvSymbol, companyName, lastClosePrice, ticker are all primitives — shallow
// comparison in memo is correct and sufficient here.
const ChartWithSkeleton = memo(function ChartWithSkeleton({
  tvSymbol,
  companyName,
  lastClosePrice,
  ticker,
}: ChartWithSkeletonProps): React.ReactElement {
  const [iframeReady, setIframeReady] = useState(false)
  const [timedOut,    setTimedOut]    = useState(false)
  const [iframeKey,   setIframeKey]   = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Memoize the src URL — only recomputes when tvSymbol changes.
  // Prevents the iframe from receiving a new src string on unrelated re-renders.
  const src = useMemo(() => buildChartSrc(tvSymbol), [tvSymbol])

  // Reset iframe state when the symbol changes (user switches company)
  useEffect(() => {
    setIframeReady(false)
    setTimedOut(false)
    setIframeKey((k) => k + 1)
  }, [tvSymbol])

  // Timeout guard — starts fresh after each iframeKey bump
  useEffect(() => {
    if (iframeReady) return
    timeoutRef.current = setTimeout(() => setTimedOut(true), IFRAME_LOAD_TIMEOUT_MS)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [iframeKey, iframeReady])

  const handleLoad = useCallback((): void => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIframeReady(true)
    setTimedOut(false)
  }, [])

  const handleError = useCallback((): void => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setTimedOut(true)
  }, [])

  const handleRetry = useCallback((): void => {
    setIframeReady(false)
    setTimedOut(false)
    setIframeKey((k) => k + 1)
  }, [])

  // Timeout / iframe error → show unavailable banner in place of chart
  if (timedOut) {
    return (
      <ChartUnavailableBanner
        reason="timeout"
        lastClosePrice={lastClosePrice}
        ticker={ticker}
        onRetry={handleRetry}
      />
    )
  }

  return (
    <div className="relative w-full h-[300px] sm:h-[360px]">
      {/* Skeleton fades out once iframe is ready */}
      <AnimatePresence>
        {!iframeReady && (
          <motion.div
            key="chart-skeleton"
            className="absolute inset-0 z-10"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
          >
            <ChartSkeleton height="h-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Iframe pre-loads invisibly, fades in on load */}
      <motion.div
        className="w-full h-full rounded-xl overflow-hidden border border-[#242B36]"
        initial={{ opacity: 0 }}
        animate={{ opacity: iframeReady ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeIn' }}
      >
        <iframe
          key={iframeKey}
          src={src}
          title={`${companyName} price chart`}
          className="w-full h-full border-none block bg-[#0B0E11]"
          allowFullScreen
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onLoad={handleLoad}
          onError={handleError}
        />
      </motion.div>
    </div>
  )
})
ChartWithSkeleton.displayName = 'ChartWithSkeleton'

// ─────────────────────────────────────────────────────────────
// DRAWER CONTENT BODY
// ─────────────────────────────────────────────────────────────

interface DrawerContentBodyProps {
  company:     Company
  accentColor: string
  layer:       Pick<SupplyChainLayer, 'id' | 'title'>
}

function DrawerContentBody({ company, layer }: DrawerContentBodyProps): React.ReactElement {
  const { status } = useQuote(company.tvSymbol, !company.priv)
  const isLoading  = status === 'idle' || status === 'loading'

  return (
    <AnimatePresence mode="wait">
      {isLoading && !company.priv ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.1 }}
        >
          <DrawerSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col"
        >
          {/* ① LIVE PRICE */}
          <LivePriceBlock company={company} />

          {/* ② CHART — wrapped in Error Boundary */}
          <div className="px-5 py-4 border-b border-[#242B36]">
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2.5">
              Price Chart
              {!company.priv && (
                <span className="ml-1.5 text-zinc-700">· TradingView · Daily</span>
              )}
            </p>

            {company.priv || company.tvSymbol === null ? (
              // Private company locked state
              <div
                className="w-full h-[220px] rounded-xl border border-[#242B36] bg-[#13171D] flex flex-col items-center justify-center gap-2 text-zinc-600"
                aria-label="No market data — private company"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28" height="28" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="text-[10px] font-mono tracking-widest uppercase">
                  Private — No Market Data
                </p>
              </div>
            ) : (
              // Public company — Error Boundary wraps the entire chart
              <ChartErrorBoundary
                lastClosePrice={company.price}
                ticker={company.ticker}
                height="h-[300px] sm:h-[360px]"
              >
                <ChartWithSkeleton
                  tvSymbol={company.tvSymbol}
                  companyName={company.name}
                  lastClosePrice={company.price}
                  ticker={company.ticker}
                />
              </ChartErrorBoundary>
            )}
          </div>

          {/* ③ SMART INSIGHT */}
          <SmartInsight company={company} layer={layer} />

          {/* ④ DESCRIPTION */}
          <div className="px-5 py-4 border-b border-[#242B36]">
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
              GS Research — Company Overview
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">{company.desc}</p>
          </div>

          {/* ⑤ MARKET DATA GRID */}
          {!company.priv && (
            <div className="px-5 py-4 border-b border-[#242B36]">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2.5">
                Market Data
              </p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                {[
                  { label: 'Market Cap', value: company.mktcap },
                  { label: '52W High',   value: company.hi     },
                  { label: '52W Low',    value: company.lo     },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-mono font-semibold text-zinc-200">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ⑥ CORE CHARACTERISTICS */}
          <RoleTags roles={company.roles} tags={company.tags} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT: CompanyDrawer
// ─────────────────────────────────────────────────────────────

interface CompanyDrawerProps {
  company:      Company | null
  accentColor:  string
  layer:        Pick<SupplyChainLayer, 'id' | 'title'>
  open:         boolean
  onOpenChange: (open: boolean) => void
}

export function CompanyDrawer({
  company,
  accentColor,
  layer,
  open,
  onOpenChange,
}: CompanyDrawerProps): React.ReactElement {
  const titleId = useId()

  if (company === null) return <></>

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        aria-labelledby={titleId}
        className="
          bg-[#0B0E11] border-t border-[#242B36]
          rounded-t-2xl max-h-[92dvh] focus:outline-none
        "
      >
        {/* ── Drag handle + close row ───────────────────────────
            Large hit area (py-3) so thumbs can dismiss from
            the very top of the sheet without precision tapping.
            The explicit ✕ button is a non-swipe fallback for
            users on iOS/Android who prefer tap-to-close.       */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          {/* Left spacer balances the close button visually */}
          <div className="w-8" aria-hidden="true" />

          {/* Drag handle — centred, enlarged hit area */}
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close company details"
            className="
              flex flex-col items-center justify-center gap-0
              py-2 px-8 -my-2 rounded-lg
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
            "
          >
            <span className="w-10 h-1 rounded-full bg-[#2E3748]" aria-hidden="true" />
          </button>

          {/* Explicit close button — visible tap target */}
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="
              w-8 h-8 rounded-lg flex items-center justify-center
              border border-[#242B36] bg-[#13171D]
              text-zinc-500 hover:text-zinc-200 hover:border-zinc-600
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
            "
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Top accent bar */}
        <div
          className="mx-5 h-px rounded-full"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
          aria-hidden="true"
        />

        <div className="overflow-y-auto overscroll-contain flex flex-col">
          <DrawerHeader className="sr-only">
            <DrawerTitle id={titleId}>
              {company.name} — Company Details
            </DrawerTitle>
            <DrawerDescription>
              Live price, chart, and supply chain characteristics for {company.name}.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerContentBody
            company={company}
            accentColor={accentColor}
            layer={layer}
          />

          {/* Safe-area spacer — prevents content sitting behind the iOS home bar */}
          <div
            className="flex-shrink-0"
            style={{ height: 'max(24px, env(safe-area-inset-bottom))' }}
            aria-hidden="true"
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
