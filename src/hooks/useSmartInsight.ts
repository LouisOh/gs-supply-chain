'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { InsightResponse } from '@/app/api/insight/route'
import type { Company, SupplyChainLayer } from '@/types/supply-chain'

export type InsightStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseSmartInsightReturn {
  insight:   string | null
  riskLevel: InsightResponse['riskLevel']
  status:    InsightStatus
  error:     string | null
  cached:    boolean
  refetch:   () => void
}

export function useSmartInsight(
  company: Company,
  layer:   Pick<SupplyChainLayer, 'id' | 'title'>,
): UseSmartInsightReturn {
  const [insight,   setInsight]   = useState<string | null>(null)
  const [riskLevel, setRiskLevel] = useState<InsightResponse['riskLevel']>('unknown')
  const [status,    setStatus]    = useState<InsightStatus>('idle')
  const [error,     setError]     = useState<string | null>(null)
  const [cached,    setCached]    = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchInsight = useCallback(async (): Promise<void> => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setStatus('loading')
    setError(null)
    setCached(false)

    try {
      const res = await fetch('/api/insight', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker:     company.ticker,
          name:       company.name,
          layerId:    layer.id,
          layerTitle: layer.title,
          tags:       company.tags,
          roles:      company.roles,
          mktcap:     company.mktcap,
          priv:       company.priv,
          chg:        company.chg,
          pos:        company.pos,
        }),
        signal: abortRef.current.signal,
      })

      const json = (await res.json()) as InsightResponse

      if (!res.ok || json.error !== null || json.insight === null) {
        setError(json.error ?? 'Failed to generate insight')
        setStatus('error')
        return
      }

      setInsight(json.insight)
      setRiskLevel(json.riskLevel)
      setCached(json.cached)
      setStatus('success')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Network error')
      setStatus('error')
    }
  }, [company, layer])

  useEffect(() => {
    void fetchInsight()
    return () => { abortRef.current?.abort() }
  }, [fetchInsight])

  return { insight, riskLevel, status, error, cached, refetch: fetchInsight }
}
