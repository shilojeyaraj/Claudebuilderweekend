import type { NextRequest } from 'next/server'
import { fetchDebates } from '@/lib/openparliament'

/**
 * GET /api/debates?bill=<openparliament-bill-url>
 *
 * Returns Hansard debate sections that mention a bill, from OpenParliament.
 * The `bill` param should be an OpenParliament URL e.g. `/bills/45-1/C-56/`
 *
 * Each debate section includes:
 *   - date, heading, paragraph count
 *   - link to the full Hansard transcript on OpenParliament
 */
export async function GET(request: NextRequest) {
  const billUrl = request.nextUrl.searchParams.get('bill')

  if (!billUrl) {
    return Response.json({ error: 'Missing required param: bill' }, { status: 400 })
  }

  const sections = await fetchDebates(billUrl)

  return Response.json({
    bill: billUrl,
    total: sections.length,
    debates: sections.map((s) => ({
      date: s.date,
      heading: s.heading,
      paragraphCount: s.paragraph_count,
      speakerUrl: s.speaker_politician_url
        ? `https://openparliament.ca${s.speaker_politician_url}`
        : null,
      transcriptUrl: s.hansard_url,
    })),
  })
}
