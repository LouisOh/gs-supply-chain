'use client'

/**
 * Skeleton Components
 * ─────────────────────────────────────────────────────────────
 * Three exports:
 *   1. <Shimmer>         — base animated shimmer block (any size)
 *   2. <CompanyCardSkeleton> — mirrors CompanyCard layout exactly
 *   3. <ChartSkeleton>   — mirrors TradingView chart embed area
 *   4. <DrawerSkeleton>  — mirrors full CompanyDrawer loading state
 *
 * Design rules (CLAUDE.md):
 *   - bg: #13171D (surface), shimmer highlight: #1A1F28 → #242B36
 *   - No layout shift: every skeleton matches the real element's
 *     padding, gap, border-radius, and height exactly.
 *   - respects prefers-reduced-motion via Framer Motion
 */



import { useReducedMotion, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// 1. SHIMMER PRIMITIVE
// ─────────────────────────────────────────────────────────────

interface ShimmerProps {
  className?: string
  /** Override border-radius. Defaults to rounded-md */
  rounded?: string
  style?: React.CSSProperties
}

export function Shimmer({ className, rounded = 'rounded-md', style }: ShimmerProps): React.ReactElement {
  const reduced = useReducedMotion()

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn('relative overflow-hidden bg-[#1A1F28]', rounded, className)}
      style={style}
    >
      {/* Moving highlight band */}
      {!reduced && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.045) 45%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.045) 55%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPositionX: ['200%', '-200%'] }}
          transition={{
            duration: 1.6,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. COMPANY CARD SKELETON
//    Mirrors CompanyCard exactly:
//    ┌──────────────────────────────────────────┐
//    │ ▓▓▓▓▓▓ (ticker 48px)  ▓▓▓▓▓▓ (price 56px) │  ← row h-4
//    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (name 70%)             │  ← h-4 mt-1
//    │                                          │
//    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← desc line 1
//    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  ← desc line 2
//    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                │  ← desc line 3
//    │                                          │
//    │ ▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓                  │  ← tags
//    ├──────────────────────────────────────────┤
//    │ ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓                    │  ← mktcap/hi/lo
//    └──────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────

interface CompanyCardSkeletonProps {
  /** Whether to render the market-data footer (public vs private card) */
  showFooter?: boolean
}

export function CompanyCardSkeleton({ showFooter = true }: CompanyCardSkeletonProps): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      aria-label="Loading company data"
      className="relative rounded-xl border border-[#242B36] bg-[#13171D] p-4"
    >
      {/* Top accent line placeholder */}
      <Shimmer className="absolute top-0 left-4 right-4 h-px" rounded="rounded-full" />

      {/* ── Row 1: ticker + price ── */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* ticker */}
          <Shimmer className="h-3 w-12" />
          {/* company name */}
          <Shimmer className="h-4 w-[68%]" />
        </div>
        {/* price + chg */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Shimmer className="h-4 w-14" />
          <Shimmer className="h-3 w-10" />
        </div>
      </div>

      {/* ── Description: 3 lines ── */}
      <div className="flex flex-col gap-1.5 mb-3">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-[92%]" />
        <Shimmer className="h-3 w-[60%]" />
      </div>

      {/* ── Tags row: 2–3 pill stubs ── */}
      <div className="flex gap-1.5 mb-0">
        <Shimmer className="h-4 w-16" rounded="rounded-md" />
        <Shimmer className="h-4 w-12" rounded="rounded-md" />
        <Shimmer className="h-4 w-14" rounded="rounded-md" />
      </div>

      {/* ── Market data footer ── */}
      {showFooter && (
        <div className="mt-3 pt-2.5 border-t border-[#1A1F28] grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1">
              {/* label */}
              <Shimmer className="h-2 w-10" />
              {/* value */}
              <Shimmer className="h-3 w-14" />
            </div>
          ))}
        </div>
      )}

      {/* "TAP FOR LIVE CHART" hint stub */}
      <Shimmer className="mt-2.5 h-2 w-28" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. CHART SKELETON
//    Mirrors TradingViewChart container:
//    h-[300px] sm:h-[360px] w-full rounded-xl
//    Shows a mock chart shape: flat baseline + 2 subtle
//    "price bars" rendered as gradient blocks, plus axis stubs.
// ─────────────────────────────────────────────────────────────

interface ChartSkeletonProps {
  /** Match TradingView embed — sm:360px default */
  height?: string
  className?: string
}

export function ChartSkeleton({ height = 'h-[300px] sm:h-[360px]', className }: ChartSkeletonProps): React.ReactElement {
  const reduced = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      aria-label="Loading chart"
      className={cn(
        'w-full rounded-xl border border-[#242B36] bg-[#0B0E11] overflow-hidden relative',
        height,
        className,
      )}
    >
      {/* Shimmer wash over the whole area */}
      {!reduced && (
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.025) 45%, rgba(255,255,255,0.045) 50%, rgba(255,255,255,0.025) 55%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPositionX: ['200%', '-200%'] }}
          transition={{ duration: 2.2, ease: 'linear', repeat: Infinity }}
        />
      )}

      {/* ── Mock chart interior ── */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">

        {/* Top toolbar stubs */}
        <div className="flex items-center gap-2">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-12" />
          <Shimmer className="h-4 w-12" />
          <Shimmer className="h-4 w-12" />
          <div className="ml-auto flex gap-1.5">
            <Shimmer className="h-4 w-8" />
            <Shimmer className="h-4 w-8" />
          </div>
        </div>

        {/* Chart body — mock candlestick bars */}
        <div className="flex-1 flex items-end gap-[3px] px-1 py-4">
          {/* Generate 36 mock "candles" with varying heights */}
          {MOCK_CANDLE_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end gap-[1px]"
            >
              {/* Wick stub */}
              <div
                className="w-px bg-[#242B36]"
                style={{ height: `${h.wick}%` }}
              />
              {/* Body */}
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${h.body}%`,
                  background: h.up ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${h.up ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.2)'}`,
                  minHeight: 2,
                }}
              />
            </div>
          ))}
        </div>

        {/* X-axis date stubs */}
        <div className="flex justify-between px-1">
          {['', '', '', '', '', ''].map((_, i) => (
            <Shimmer key={i} className="h-2 w-8" />
          ))}
        </div>
      </div>

      {/* Y-axis price stubs on the right */}
      <div className="absolute right-3 top-12 bottom-8 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <Shimmer key={i} className="h-2 w-10" />
        ))}
      </div>
    </div>
  )
}

/** Pre-generated deterministic "candle" shapes — avoids random rerenders */
const MOCK_CANDLE_HEIGHTS: Array<{ body: number; wick: number; up: boolean }> = [
  { body: 22, wick: 8,  up: true  },
  { body: 18, wick: 6,  up: false },
  { body: 30, wick: 10, up: true  },
  { body: 15, wick: 5,  up: true  },
  { body: 25, wick: 9,  up: false },
  { body: 20, wick: 7,  up: true  },
  { body: 35, wick: 12, up: true  },
  { body: 14, wick: 4,  up: false },
  { body: 28, wick: 8,  up: true  },
  { body: 22, wick: 6,  up: false },
  { body: 18, wick: 7,  up: true  },
  { body: 40, wick: 14, up: true  },
  { body: 16, wick: 5,  up: false },
  { body: 32, wick: 11, up: true  },
  { body: 24, wick: 8,  up: false },
  { body: 19, wick: 6,  up: true  },
  { body: 27, wick: 9,  up: true  },
  { body: 21, wick: 7,  up: false },
  { body: 36, wick: 13, up: true  },
  { body: 17, wick: 5,  up: false },
  { body: 29, wick: 10, up: true  },
  { body: 23, wick: 7,  up: true  },
  { body: 38, wick: 14, up: false },
  { body: 15, wick: 4,  up: true  },
  { body: 26, wick: 9,  up: false },
  { body: 31, wick: 11, up: true  },
  { body: 20, wick: 6,  up: true  },
  { body: 44, wick: 15, up: true  },
  { body: 18, wick: 5,  up: false },
  { body: 33, wick: 12, up: true  },
  { body: 25, wick: 8,  up: false },
  { body: 22, wick: 7,  up: true  },
  { body: 16, wick: 5,  up: true  },
  { body: 37, wick: 13, up: false },
  { body: 28, wick: 9,  up: true  },
  { body: 21, wick: 6,  up: true  },
]

// ─────────────────────────────────────────────────────────────
// 4. DRAWER SKELETON
//    Full CompanyDrawer loading state — shown while live price
//    is fetching. Mirrors every section of CompanyDrawer.
//
//    Sections:
//    ① Live price header  (big price + meta row)
//    ② Chart area         (uses ChartSkeleton)
//    ③ Description        (3 text lines)
//    ④ Market data grid   (3 cols)
//    ⑤ Role tags          (5 pill stubs)
// ─────────────────────────────────────────────────────────────

export function DrawerSkeleton(): React.ReactElement {
  return (
    <div aria-hidden="true" aria-label="Loading company details" className="flex flex-col">

      {/* ① LIVE PRICE HEADER */}
      <div className="px-5 pt-4 pb-3 border-b border-[#242B36]">
        {/* Ticker + name */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-5 w-[55%]" />
          </div>
          {/* Refresh button stub */}
          <Shimmer className="h-8 w-8 flex-shrink-0" rounded="rounded-lg" />
        </div>

        {/* Big price */}
        <div className="flex items-end gap-3 mb-2">
          <Shimmer className="h-10 w-36" rounded="rounded-lg" />
          <div className="flex flex-col gap-1.5 pb-0.5">
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-3 w-12" />
          </div>
        </div>

        {/* Meta row: Open / High / Low / Vol */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
          {[56, 48, 48, 44].map((w, i) => (
            <Shimmer key={i} className="h-3" style={{ width: w }} />
          ))}
        </div>

        {/* "As of" timestamp stub */}
        <Shimmer className="mt-1.5 h-2 w-40" />
      </div>

      {/* ② CHART */}
      <div className="px-5 py-4 border-b border-[#242B36]">
        {/* Section label */}
        <Shimmer className="h-2 w-24 mb-2.5" />
        <ChartSkeleton height="h-[300px] sm:h-[360px]" />
      </div>

      {/* ③ SMART INSIGHT skeleton */}
      <div className="px-5 py-4 border-b border-[#242B36]">
        {/* Section label row */}
        <div className="flex items-center gap-2 mb-3">
          <Shimmer className="h-2 w-24" />
          <Shimmer className="h-4 w-6" rounded="rounded-sm" />
        </div>
        {/* Insight card shell */}
        <div className="rounded-xl border border-[#242B36] bg-[#13171D] p-4 flex flex-col gap-3">
          {/* Badge + meter row */}
          <div className="flex items-center justify-between gap-3">
            <Shimmer className="h-5 w-28" rounded="rounded-md" />
            <Shimmer className="h-3 w-12" rounded="rounded-full" />
          </div>
          {/* Risk meter */}
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-1 flex-1" rounded="rounded-full" />
            ))}
          </div>
          {/* Insight text lines */}
          <div className="flex flex-col gap-1.5">
            <Shimmer className="h-3.5 w-full" />
            <Shimmer className="h-3.5 w-[68%]" />
          </div>
        </div>
      </div>

      {/* ④ DESCRIPTION */}
      <div className="px-5 py-4 border-b border-[#242B36]">
        <Shimmer className="h-2 w-48 mb-2.5" />
        <div className="flex flex-col gap-2">
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-[97%]" />
          <Shimmer className="h-3 w-[93%]" />
          <Shimmer className="h-3 w-[88%]" />
          <Shimmer className="h-3 w-[55%]" />
        </div>
      </div>

      {/* ⑤ MARKET DATA GRID */}
      <div className="px-5 py-4 border-b border-[#242B36]">
        <Shimmer className="h-2 w-24 mb-2.5" />
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Shimmer className="h-2 w-14" />
              <Shimmer className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* ⑥ CORE CHARACTERISTICS */}
      <div className="px-5 py-4">
        <Shimmer className="h-2 w-36 mb-2.5" />
        {/* Position tag stubs */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          <Shimmer className="h-5 w-20" rounded="rounded-md" />
          <Shimmer className="h-5 w-16" rounded="rounded-md" />
        </div>
        {/* Role tag stubs */}
        <div className="flex flex-wrap gap-1.5">
          {[88, 72, 96, 64, 80, 56, 76].map((w, i) => (
            <Shimmer key={i} className="h-8" style={{ width: w }} rounded="rounded-lg" />
          ))}
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 5. CARD GRID SKELETON
//    Drop-in replacement for the entire company grid while
//    a layer is switching — renders N skeleton cards in the
//    same responsive grid layout.
// ─────────────────────────────────────────────────────────────

interface CardGridSkeletonProps {
  /** Number of skeleton cards to render. Defaults to 12 */
  count?: number
}

export function CardGridSkeleton({ count = 12 }: CardGridSkeletonProps): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label="Loading companies"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CompanyCardSkeleton key={i} showFooter={i % 5 !== 3} />
      ))}
    </div>
  )
}
