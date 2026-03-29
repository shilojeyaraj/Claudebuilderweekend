import type { NextRequest } from 'next/server'
import { getBills } from '@/lib/legisinfo'
import { getTopicTag } from '@/lib/bills'
import type { Bill } from '@/lib/types'

/**
 * GET /api/bills
 *
 * Query params (all optional):
 *   search   — free-text filter across title, code, sponsor
 *   chamber  — "House" | "Senate"  (omit for all)
 *   topic    — topic tag string    (omit for all)
 *   limit    — max results         (default 200)
 *   offset   — pagination offset   (default 0)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const search = searchParams.get('search')?.toLowerCase() ?? ''
  const chamber = searchParams.get('chamber') ?? ''
  const topic = searchParams.get('topic') ?? ''
  const limit = Math.min(Number(searchParams.get('limit') ?? 200), 500)
  const offset = Number(searchParams.get('offset') ?? 0)

  let bills: Bill[]
  try {
    bills = await getBills()
  } catch {
    return Response.json({ error: 'Failed to load bills' }, { status: 503 })
  }

  const filtered = bills.filter((b) => {
    if (chamber === 'House' && !b.IsHouseBill) return false
    if (chamber === 'Senate' && !b.IsSenateBill) return false

    if (topic && getTopicTag(b) !== topic) return false

    if (search) {
      const hay =
        `${b.ShortTitleEn} ${b.LongTitleEn} ${b.NumberCode} ${b.SponsorPersonName}`.toLowerCase()
      if (!hay.includes(search)) return false
    }

    return true
  })

  const page = filtered.slice(offset, offset + limit)

  return Response.json({
    total: filtered.length,
    offset,
    limit,
    bills: page,
  })
}
