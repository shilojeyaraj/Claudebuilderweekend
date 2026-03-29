import { getTally, recordVote } from '@/lib/sentiment-store'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const billId = Number(searchParams.get('billId'))
  if (!billId) return Response.json({ error: 'Missing billId' }, { status: 400 })
  return Response.json(getTally(billId))
}

export async function POST(req: Request) {
  const { billId, direction }: { billId: number; direction: 'support' | 'oppose' } =
    await req.json()

  if (!billId || !['support', 'oppose'].includes(direction)) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const updated = recordVote(billId, direction)
  return Response.json(updated)
}
