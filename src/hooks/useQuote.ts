'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type QuoteStatus = 'idle' | 'loading' | 'success' | 'error'

export interface QuoteData {
  symbol:           string
  price:            number
  previousClose:    number
  change:           number
  changePercent:    string
  open:             string
  high:             string
  low:              string
  volume:           string
  latestTradingDay: string
  isPositive:       boolean
}

export interface UseQuoteReturn {
  quote:   QuoteData | null
  status:  QuoteStatus
  error:   string | null
  isStale: boolean
  refetch: () => void
}

const STALE_AFTER_MS = 90_000

export function useQuote(
  tvSymbol: string | null,
  enabled: boolean = true,
): UseQuoteReturn {
  const [quote,   setQuote]   = useState<QuoteData | null>(null)
  const [status,  setStatus]  = useState<QuoteStatus>('idle')
  const [error,   setError]   = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef      = useRef<AbortController | null>(null)

  const fetch_ = useCallback(async (symbol: string): Promise<void> => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setStatus('loading')
    setError(null)
    setIsStale(false)

    if (staleTimerRef.current) clearTimeout(staleTimerRef.current)

    try {
      const res  = await fetch(
        `/api/quote?symbol=${encodeURIComponent(symbol)}`,
        { signal: abortRef.current.signal },
      )
      const json = (await res.json()) as { data: QuoteData | null; error: string | null }

      if (!res.ok || json.error !== null || json.data === null) {
        setError(json.error ?? 'Failed to fetch quote')
        setStatus('error')
        return
      }

      setQuote(json.data)
      setStatus('success')
      staleTimerRef.current = setTimeout(() => setIsStale(true), STALE_AFTER_MS)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Network error')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!enabled || tvSymbol === null) {
      setStatus('idle')
      setQuote(null)
      return
    }
    void fetch_(tvSymbol)
    return () => {
      abortRef.current?.abort()
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current)
    }
  }, [tvSymbol, enabled, fetch_])

  const refetch = useCallback((): void => {
    if (tvSymbol !== null) void fetch_(tvSymbol)
  }, [tvSymbol, fetch_])

  return { quote, status, error, isStale, refetch }
}
