'use client'




/**
 * Chart Error Boundary System
 * ─────────────────────────────────────────────────────────────
 * Three exports:
 *
 *  1. ChartErrorBoundary  — React class component (required for
 *     componentDidCatch); wraps any chart child. Catches:
 *       • Thrown JS errors inside the render tree
 *       • Iframe / TradingView widget crashes
 *     Renders ChartErrorFallback in place of the broken chart.
 *     The rest of the drawer/page is completely unaffected.
 *
 *  2. ChartErrorFallback  — friendly "unavailable" UI shown when
 *     the Error Boundary catches a throw. Shows last-close price.
 *
 *  3. ChartUnavailableBanner — lightweight banner shown when the
 *     quote API returns an error or a timeout fires (NOT a thrown
 *     error — those go to the boundary). Used inside LivePriceBlock.
 *
 * Design tokens (CLAUDE.md):
 *   bg-surface  #13171D   border  #242B36
 *   amber       #F59E0B   muted   #94A3B8
 */

import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
// REASON CLASSIFIER
// ─────────────────────────────────────────────────────────────

type ChartFailureReason =
  | 'market_closed'
  | 'network_error'
  | 'api_limit'
  | 'symbol_not_found'
  | 'timeout'
  | 'unknown'

function classifyFailure(err: unknown, hint?: string): ChartFailureReason {
  const msg = [
    err instanceof Error ? err.message : String(err),
    hint ?? '',
  ].join(' ').toLowerCase()

  if (msg.includes('market') || msg.includes('closed') || msg.includes('trading hours')) {
    return 'market_closed'
  }
  if (msg.includes('rate') || msg.includes('limit') || msg.includes('429')) {
    return 'api_limit'
  }
  if (msg.includes('symbol') || msg.includes('not found') || msg.includes('404')) {
    return 'symbol_not_found'
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'timeout'
  }
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('failed to load') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('econnrefused')
  ) {
    return 'network_error'
  }
  return 'unknown'
}

const REASON_COPY: Record<
  ChartFailureReason,
  { headline: string; sub: string; icon: string }
> = {
  market_closed: {
    headline: 'Live data currently unavailable—showing last close price.',
    sub:      'Markets are outside regular trading hours. The chart will reload automatically when trading resumes.',
    icon:     '🕐',
  },
  network_error: {
    headline: 'Live data currently unavailable—showing last close price.',
    sub:      'A network error prevented the chart from loading. Check your connection and try again.',
    icon:     '📡',
  },
  api_limit: {
    headline: 'Live data currently unavailable—showing last close price.',
    sub:      'Data provider rate limit reached. Live prices will resume shortly.',
    icon:     '⏱',
  },
  symbol_not_found: {
    headline: 'Live data currently unavailable—showing last close price.',
    sub:      'This symbol was not found on the data provider. Static reference data is shown below.',
    icon:     '🔍',
  },
  timeout: {
    headline: 'Live data currently unavailable—showing last close price.',
    sub:      'The chart took too long to load. This usually resolves on retry.',
    icon:     '⏳',
  },
  unknown: {
    headline: 'Live data currently unavailable—showing last close price.',
    sub:      'An unexpected error occurred loading the chart. All other company data remains available.',
    icon:     '◎',
  },
}

// ─────────────────────────────────────────────────────────────
// CHART ERROR FALLBACK
// Full-height replacement rendered inside the boundary.
// ─────────────────────────────────────────────────────────────

export interface ChartErrorFallbackProps {
  error:          unknown
  hint?:          string
  lastClosePrice: string
  ticker:         string
  onRetry:        () => void
  height?:        string
}

export function ChartErrorFallback({
  error,
  hint,
  lastClosePrice,
  ticker,
  onRetry,
  height = 'h-[300px] sm:h-[360px]',
}: ChartErrorFallbackProps): React.ReactElement {
  const reason = classifyFailure(error, hint)
  const copy   = REASON_COPY[reason]

  return (
    <motion.div
      role="alert"
      aria-live="polite"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={[
        'w-full rounded-xl border border-[#242B36] bg-[#13171D]',
        'flex flex-col items-center justify-center gap-4 px-6',
        height,
      ].join(' ')}
    >
      {/* Icon */}
      <span className="text-3xl select-none" aria-hidden="true">
        {copy.icon}
      </span>

      {/* Headline + sub */}
      <div className="text-center max-w-xs">
        <p className="text-sm font-mono font-medium text-zinc-300 leading-snug mb-1.5">
          {copy.headline}
        </p>
        <p className="text-[11px] font-mono text-zinc-600 leading-relaxed">
          {copy.sub}
        </p>
      </div>

      {/* Last close price pill */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5"
        aria-label={`${ticker} last close price: ${lastClosePrice}`}
      >
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[9px] font-mono text-amber-500/60 uppercase tracking-widest">
            {ticker} · Last Close
          </span>
          <span className="text-xl font-mono font-bold text-amber-400 leading-none tracking-tight">
            {lastClosePrice}
          </span>
        </div>
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 self-center"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      </div>

      {/* Retry */}
      <button
        onClick={onRetry}
        aria-label={`Retry loading chart for ${ticker}`}
        className="
          flex items-center gap-2 px-4 py-2 rounded-lg
          border border-[#242B36] bg-[#1A1F28]
          text-[11px] font-mono text-zinc-400
          hover:border-amber-500/30 hover:text-amber-400
          transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="11" height="11" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        Try again
      </button>

      <p className="text-[9px] font-mono text-zinc-700 text-center">
        All other company data remains available below.
      </p>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// CHART ERROR BOUNDARY
// Class component — hooks cannot catch render errors.
// ─────────────────────────────────────────────────────────────

interface ChartErrorBoundaryProps {
  children:       ReactNode
  lastClosePrice: string
  ticker:         string
  height?:        string
}

interface ChartErrorBoundaryState {
  hasError:  boolean
  error:     unknown
  renderKey: number
}

export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props)
    this.state    = { hasError: false, error: null, renderKey: 0 }
    this.handleRetry = this.handleRetry.bind(this)
  }

  static getDerivedStateFromError(
    error: unknown,
  ): Partial<ChartErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ChartErrorBoundary] Caught render error:', {
      ticker:    this.props.ticker,
      message:   error.message,
      stack:     error.stack?.slice(0, 400),
      component: info.componentStack?.slice(0, 400),
    })
  }

  handleRetry(): void {
    this.setState((prev) => ({
      hasError:  false,
      error:     null,
      renderKey: prev.renderKey + 1,
    }))
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ChartErrorFallback
          error={this.state.error}
          lastClosePrice={this.props.lastClosePrice}
          ticker={this.props.ticker}
          onRetry={this.handleRetry}
          height={this.props.height}
        />
      )
    }

    return (
      <div key={this.state.renderKey}>
        {this.props.children}
      </div>
    )
  }
}

// ─────────────────────────────────────────────────────────────
// CHART UNAVAILABLE BANNER
// Lightweight banner for soft failures:
//   - Quote API fetch error
//   - Iframe load timeout (onLoad never fires)
//   - Stale data
//   - Market closed hours (detected from API response)
// Does NOT use the Error Boundary — it's a plain React component.
// ─────────────────────────────────────────────────────────────

export interface ChartUnavailableBannerProps {
  reason:         'api_error' | 'timeout' | 'stale' | 'market_closed'
  lastClosePrice: string
  ticker:         string
  onRetry:        () => void
}

const BANNER_CONFIG = {
  api_error:     { color: 'amber', icon: '⚠',  label: 'API Error'     },
  timeout:       { color: 'amber', icon: '⏳', label: 'Load Timeout'  },
  stale:         { color: 'blue',  icon: '◉',  label: 'Stale Data'    },
  market_closed: { color: 'amber', icon: '🕐', label: 'Market Closed' },
} as const

type BannerColor = 'amber' | 'blue'

const COLOR_CLASSES: Record<
  BannerColor,
  { border: string; bg: string; text: string; badge: string; badgeText: string }
> = {
  amber: {
    border:    'border-amber-500/20',
    bg:        'bg-amber-500/5',
    text:      'text-amber-400/80',
    badge:     'bg-amber-500/10 border-amber-500/25',
    badgeText: 'text-amber-400',
  },
  blue: {
    border:    'border-blue-500/20',
    bg:        'bg-blue-500/5',
    text:      'text-blue-400/80',
    badge:     'bg-blue-500/10 border-blue-500/25',
    badgeText: 'text-blue-400',
  },
}

const BANNER_MESSAGES: Record<ChartUnavailableBannerProps['reason'], string> = {
  api_error:     'Live data currently unavailable—showing last close price.',
  timeout:       'Live data currently unavailable—showing last close price.',
  stale:         'Live data currently unavailable—showing last close price.',
  market_closed: 'Live data currently unavailable—showing last close price.',
}

export function ChartUnavailableBanner({
  reason,
  lastClosePrice,
  ticker,
  onRetry,
}: ChartUnavailableBannerProps): React.ReactElement {
  const cfg    = BANNER_CONFIG[reason]
  const colors = COLOR_CLASSES[cfg.color]
  const msg    = BANNER_MESSAGES[reason]

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={`${msg} ${ticker} last close: ${lastClosePrice}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22 }}
      className={[
        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl border',
        colors.border,
        colors.bg,
      ].join(' ')}
    >
      {/* Badge */}
      <span
        className={[
          'flex-shrink-0 text-[9px] font-mono font-semibold uppercase tracking-widest',
          'px-2 py-1 rounded-md border whitespace-nowrap',
          colors.badge,
          colors.badgeText,
        ].join(' ')}
        aria-hidden="true"
      >
        {cfg.icon} {cfg.label}
      </span>

      {/* Message */}
      <p className={`flex-1 text-[11px] font-mono leading-snug ${colors.text} min-w-0`}>
        {msg}
      </p>

      {/* Last close price */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
          Last Close
        </span>
        <span className={`text-sm font-mono font-semibold ${colors.badgeText}`}>
          {lastClosePrice}
        </span>
      </div>

      {/* Retry */}
      <button
        onClick={onRetry}
        aria-label="Retry loading live data"
        className="
          flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
          border border-[#242B36] bg-[#13171D]
          text-zinc-500 hover:text-amber-400 hover:border-amber-500/30
          transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
    </motion.div>
  )
}
