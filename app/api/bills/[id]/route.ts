import type { NextRequest } from 'next/server'
import { getLiveBillById } from '@/lib/legisinfo'
import { getTopicTag, getStatusColor } from '@/lib/bills'

/**
 * GET /api/bills/:id
 *
 * Returns a single bill enriched with computed fields (topicTag, statusColor).
 * Responds 404 when the ID is unknown.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const billId = Number(id)

  if (!billId || isNaN(billId)) {
    return Response.json({ error: 'Invalid bill ID' }, { status: 400 })
  }

  const bill = await getLiveBillById(billId)

  if (!bill) {
    return Response.json({ error: `Bill ${billId} not found` }, { status: 404 })
  }

  return Response.json({
    ...bill,
    topicTag: getTopicTag(bill),
    statusColor: getStatusColor(bill.StatusNameEn),
  })
}
