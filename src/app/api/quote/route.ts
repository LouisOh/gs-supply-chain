import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const alphaVantageSchema = z.object({
  'Global Quote': z.object({
    '01. symbol':             z.string(),
    '05. price':              z.string(),
    '08. previous close':     z.string(),
    '09. change':             z.string(),
    '10. change percent':     z.string(),
    '02. open':               z.string().optional(),
    '03. high':               z.string().optional(),
    '04. low':                z.string().optional(),
    '06. volume':             z.string().optional(),
    '07. latest trading day': z.string().optional(),
  }),
})

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

export interface QuoteResponse {
  data:   QuoteData | null
  error:  string | null
  cached: boolean
}

const cache = new Map<string, { data: QuoteData; ts: number }>()
const CACHE_TTL_MS = 60_000

export async function GET(
  request: NextRequest,
): Promise<NextResponse<QuoteResponse>> {
  const { searchParams } = new URL(request.url)
  const rawSymbol = searchParams.get('symbol')

  if (!rawSymbol?.trim()) {
    return NextResponse.json(
      { data: null, error: 'Missing symbol param', cached: false },
      { status: 400 },
    )
  }

  const symbol = rawSymbol.includes(':')
    ? (rawSymbol.split(':')[1] ?? rawSymbol)
    : rawSymbol

  const cached = cache.get(symbol)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ data: cached.data, error: null, cached: true })
  }

  const apiKey = process.env['ALPHA_VANTAGE_API_KEY']
  if (!apiKey) {
    return NextResponse.json(
      { data: null, error: 'ALPHA_VANTAGE_API_KEY not configured', cached: false },
      { status: 503 },
    )
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 60 } })

    if (!res.ok) {
      return NextResponse.json(
        { data: null, error: `Alpha Vantage HTTP ${res.status}`, cached: false },
        { status: 502 },
      )
    }

    const raw: unknown = await res.json()
    const parsed = alphaVantageSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Rate limit or invalid symbol — try again shortly', cached: false },
        { status: 429 },
      )
    }

    const q = parsed.data['Global Quote']
    const price         = parseFloat(q['05. price'])
    const previousClose = parseFloat(q['08. previous close'])
    const change        = parseFloat(q['09. change'])

    const quoteData: QuoteData = {
      symbol:           q['01. symbol'],
      price,
      previousClose,
      change,
      changePercent:    q['10. change percent'],
      open:             q['02. open']               ?? '—',
      high:             q['03. high']               ?? '—',
      low:              q['04. low']                ?? '—',
      volume:           q['06. volume']             ?? '—',
      latestTradingDay: q['07. latest trading day'] ?? '—',
      isPositive:       change >= 0,
    }

    cache.set(symbol, { data: quoteData, ts: Date.now() })
    return NextResponse.json({ data: quoteData, error: null, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error'
    return NextResponse.json(
      { data: null, error: message, cached: false },
      { status: 500 },
    )
  }
}
