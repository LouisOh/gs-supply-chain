import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ─────────────────────────────────────────────────────────────
// REQUEST SCHEMA
// ─────────────────────────────────────────────────────────────

const requestSchema = z.object({
  ticker:     z.string().min(1).max(20),
  name:       z.string().min(1).max(120),
  layerId:    z.string().min(1).max(10),
  layerTitle: z.string().min(1).max(120),
  tags:       z.array(z.enum(['dominant', 'major', 'emerging', 'critical', 'private'])),
  roles:      z.array(z.string().max(80)).max(12),
  mktcap:     z.string().max(20),
  priv:       z.boolean(),
  chg:        z.string().max(20),
  pos:        z.boolean().nullable(),
})

export type InsightRequest = z.infer<typeof requestSchema>

// ─────────────────────────────────────────────────────────────
// ANTHROPIC RESPONSE SCHEMA  (replaces loose `as { ... }` cast)
// Validates the shape we actually depend on — any extra fields
// are stripped by Zod's default behaviour.
// ─────────────────────────────────────────────────────────────

const anthropicContentBlockSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
})

const anthropicResponseSchema = z.object({
  content: z.array(anthropicContentBlockSchema),
})

// ─────────────────────────────────────────────────────────────
// RESPONSE TYPE
// ─────────────────────────────────────────────────────────────

export interface InsightResponse {
  insight:   string | null
  riskLevel: 'critical' | 'high' | 'moderate' | 'low' | 'unknown'
  cached:    boolean
  error:     string | null
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function extractRiskLevel(text: string): InsightResponse['riskLevel'] {
  const match = text.match(/\[(CRITICAL|HIGH|MODERATE|LOW)\]/i)
  if (!match?.[1]) return 'unknown'
  const val = match[1].toUpperCase()
  if (val === 'CRITICAL') return 'critical'
  if (val === 'HIGH')     return 'high'
  if (val === 'MODERATE') return 'moderate'
  if (val === 'LOW')      return 'low'
  return 'unknown'
}

function cleanInsight(text: string): string {
  return text.replace(/\s*\[(CRITICAL|HIGH|MODERATE|LOW)\]\s*/gi, '').trim()
}

// ─────────────────────────────────────────────────────────────
// IN-MEMORY CACHE  (5 min TTL per ticker:layer key)
// ─────────────────────────────────────────────────────────────

interface CacheEntry { data: InsightResponse; ts: number }
const insightCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Goldman Sachs senior equity analyst specializing in technology supply chains and AI infrastructure.

You will receive structured data about a company in the global AI supply chain. Output EXACTLY ONE sentence that:
1. Starts with the ticker symbol followed by a colon
2. States the single most material current supply chain risk or competitive advantage
3. Ends with exactly one risk token on a new line: [CRITICAL], [HIGH], [MODERATE], or [LOW]

Format:
"{TICKER}: {One sentence of analysis}
[RISK_LEVEL]"

Risk level definitions:
- [CRITICAL]: Active supply constraint, geopolitical block, or single-point-of-failure with no substitute
- [HIGH]: Significant dependency, capacity bottleneck, or concentration risk materializing within 12 months
- [MODERATE]: Structural risk or opportunity present but manageable; diversification underway
- [LOW]: Well-diversified supply chain, dominant position, or secular tailwind with minimal near-term disruption

Style rules — strictly enforced:
- Bloomberg Terminal terse prose. No hedging: never write "may", "might", "could", "potentially", "possibly"
- Present tense throughout
- Maximum 32 words in the sentence body (before the risk token)
- Cite a specific product, contract, technology, or geopolitical fact — never generic statements
- For private companies, focus on strategic positioning and funding dynamics`

// ─────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<InsightResponse>> {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { insight: null, riskLevel: 'unknown', cached: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const parsed = requestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { insight: null, riskLevel: 'unknown', cached: false, error: `Validation: ${parsed.error.issues[0]?.message ?? 'unknown'}` },
      { status: 400 },
    )
  }

  const body     = parsed.data
  const cacheKey = `${body.ticker}:${body.layerId}`

  const hit = insightCache.get(cacheKey)
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    return NextResponse.json({ ...hit.data, cached: true })
  }

  const userMessage = `
Company: ${body.name} (${body.ticker})
Supply Chain Layer: ${body.layerId} — ${body.layerTitle}
Market Position Tags: ${body.tags.join(', ')}
Core Supply Chain Roles: ${body.roles.join(' | ')}
Market Cap: ${body.mktcap}
Listed: ${body.priv ? 'Private' : 'Public'}
Price Change Today: ${body.chg} (${body.pos === true ? 'positive' : body.pos === false ? 'negative' : 'flat'})

Generate one supply chain risk insight sentence for this company.`.trim()

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 120,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { insight: null, riskLevel: 'unknown', cached: false, error: `Anthropic ${response.status}: ${text.slice(0, 120)}` },
        { status: 502 },
      )
    }

    const rawJson: unknown = await response.json()
    const parsedResponse = anthropicResponseSchema.safeParse(rawJson)

    if (!parsedResponse.success) {
      return NextResponse.json(
        { insight: null, riskLevel: 'unknown', cached: false, error: 'Unexpected Anthropic response shape' },
        { status: 502 },
      )
    }

    const rawText = parsedResponse.data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('')
      .trim()

    if (!rawText) {
      return NextResponse.json(
        { insight: null, riskLevel: 'unknown', cached: false, error: 'Empty model response' },
        { status: 502 },
      )
    }

    const riskLevel = extractRiskLevel(rawText)
    const insight   = cleanInsight(rawText)
    const result: InsightResponse = { insight, riskLevel, cached: false, error: null }

    insightCache.set(cacheKey, { data: result, ts: Date.now() })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { insight: null, riskLevel: 'unknown', cached: false, error: message },
      { status: 500 },
    )
  }
}
