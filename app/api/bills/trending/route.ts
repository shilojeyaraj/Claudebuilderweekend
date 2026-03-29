import type { NextRequest } from 'next/server'
import { getBills } from '@/lib/legisinfo'
import { getTopicTag, getStatusColor } from '@/lib/bills'

/**
 * GET /api/bills/trending
 *
 * Returns bills that have had activity in the last 30 days, sorted by most
 * recent activity first.  "Trending" in this context means actively moving
 * through Parliament right now.
 *
 * Query params:
 *   limit  — max results (default 10, max 50)
 *   days   — lookback window in days (default 30)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const limit = Math.min(Number(searchParams.get('limit') ?? 10), 50)
  const days = Math.min(Number(searchParams.get('days') ?? 30), 365)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const bills = await getBills() // already sorted newest-first

  const trending = bills
    .filter((b) => new Date(b.LatestBillEventDateTime) >= cutoff)
    .slice(0, limit)
    .map((b) => ({
      id: b.Id,
      number: b.NumberCode,
      title: b.ShortTitleEn || b.LongTitleEn,
      status: b.StatusNameEn,
      statusColor: getStatusColor(b.StatusNameEn),
      sponsor: b.SponsorPersonName,
      sponsorAffiliation: b.SponsorAffiliationTitle,
      topic: getTopicTag(b),
      isGovernmentBill: b.IsGovernmentBill,
      chamber: b.OriginatingChamberNameEn,
      lastActivity: b.LatestBillEventDateTime,
      lastEvent: b.LatestBillEventTypeNameEn,
    }))

  return Response.json({
    total: trending.length,
    days,
    bills: trending,
  })
}
