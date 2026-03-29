import type { NextRequest } from 'next/server'
import { fetchVotes } from '@/lib/openparliament'

/**
 * GET /api/votes?bill=<openparliament-bill-url>
 *
 * Returns voting records for a bill from the OpenParliament API.
 * The `bill` param should be an OpenParliament URL e.g. `/bills/45-1/C-56/`
 *
 * Each vote record includes:
 *   - date, description, result (Passed|Failed)
 *   - yea_total, nay_total counts
 *   - links to yeas/nays detail on OpenParliament
 */
export async function GET(request: NextRequest) {
  const billUrl = request.nextUrl.searchParams.get('bill')

  if (!billUrl) {
    return Response.json({ error: 'Missing required param: bill' }, { status: 400 })
  }

  const votes = await fetchVotes(billUrl)

  return Response.json({
    bill: billUrl,
    total: votes.length,
    votes: votes.map((v) => ({
      date: v.date,
      number: v.number,
      description: v.description.en,
      result: v.result,
      yeas: v.yea_total,
      nays: v.nay_total,
      paired: v.paired_total,
      detailUrl: `https://openparliament.ca${v.url}`,
    })),
  })
}
