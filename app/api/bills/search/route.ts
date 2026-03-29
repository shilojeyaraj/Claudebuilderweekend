import type { NextRequest } from 'next/server'
import { getBills } from '@/lib/legisinfo'
import { getTopicTag } from '@/lib/bills'

/**
 * GET /api/bills/search?q=<query>
 *
 * Keyword search across bill title, number code, and sponsor name.
 * Returns up to 50 results ranked by recency (already sorted by getBills()).
 *
 * Query params:
 *   q       — search string (required, min 2 chars)
 *   limit   — max results (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)

  if (q.length < 2) {
    return Response.json(
      { error: 'Query must be at least 2 characters', bills: [] },
      { status: 400 }
    )
  }

  const bills = await getBills()

  const results = bills
    .filter((b) => {
      const hay =
        `${b.ShortTitleEn} ${b.LongTitleEn} ${b.NumberCode} ${b.SponsorPersonName}`.toLowerCase()
      return hay.includes(q)
    })
    .slice(0, limit)
    .map((b) => ({
      id: b.Id,
      number: b.NumberCode,
      title: b.ShortTitleEn || b.LongTitleEn,
      status: b.StatusNameEn,
      sponsor: b.SponsorPersonName,
      topic: getTopicTag(b),
      lastActivity: b.LatestBillEventDateTime,
    }))

  return Response.json({ total: results.length, query: q, bills: results })
}
