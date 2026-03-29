// In-memory sentiment store. Sufficient for a demo/hackathon context.
// In production this would be replaced with a persistent store (e.g. Vercel KV).

interface Tally {
  support: number
  oppose: number
}

// Module-level map persists across requests within the same server process.
const store = new Map<number, Tally>()

export function getTally(billId: number): Tally {
  return store.get(billId) ?? { support: 0, oppose: 0 }
}

export function recordVote(billId: number, direction: 'support' | 'oppose'): Tally {
  const current = getTally(billId)
  const updated: Tally = {
    support: current.support + (direction === 'support' ? 1 : 0),
    oppose: current.oppose + (direction === 'oppose' ? 1 : 0),
  }
  store.set(billId, updated)
  return updated
}
