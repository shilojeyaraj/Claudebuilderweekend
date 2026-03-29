'use client'

import { useState, useEffect } from 'react'

interface Tally {
  support: number
  oppose: number
}

export default function SentimentPoll({ billId }: { billId: number }) {
  const [tally, setTally] = useState<Tally | null>(null)
  const [voted, setVoted] = useState<'support' | 'oppose' | null>(null)
  const [loading, setLoading] = useState(false)

  // Restore prior vote from localStorage so users can't double-vote
  useEffect(() => {
    const stored = localStorage.getItem(`vote-${billId}`) as 'support' | 'oppose' | null
    setVoted(stored)
    fetch(`/api/sentiment?billId=${billId}`)
      .then((r) => r.json())
      .then(setTally)
  }, [billId])

  async function castVote(direction: 'support' | 'oppose') {
    if (voted || loading) return
    setLoading(true)
    const res = await fetch('/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billId, direction }),
    })
    const updated = await res.json()
    setTally(updated)
    setVoted(direction)
    localStorage.setItem(`vote-${billId}`, direction)
    setLoading(false)
  }

  const total = (tally?.support ?? 0) + (tally?.oppose ?? 0)
  const supportPct = total === 0 ? 50 : Math.round(((tally?.support ?? 0) / total) * 100)
  const opposePct = 100 - supportPct

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 text-sm mb-1">What do Canadians think?</h3>
      <p className="text-xs text-gray-400 mb-4">Anonymous · one vote per bill</p>

      {!voted ? (
        <div className="flex gap-2">
          <button
            onClick={() => castVote('support')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-green-200 hover:bg-green-50 hover:border-green-400 text-green-700 font-medium text-sm transition-all disabled:opacity-50"
          >
            <span className="text-lg">👍</span> Support
          </button>
          <button
            onClick={() => castVote('oppose')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-red-200 hover:bg-red-50 hover:border-red-400 text-red-700 font-medium text-sm transition-all disabled:opacity-50"
          >
            <span className="text-lg">👎</span> Oppose
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-green-700">Support {supportPct}%</span>
            <span className="text-red-600">Oppose {opposePct}%</span>
          </div>
          <div className="h-3 rounded-full bg-red-200 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${supportPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            {total} {total === 1 ? 'response' : 'responses'} ·{' '}
            <span className={voted === 'support' ? 'text-green-600' : 'text-red-600'}>
              You {voted === 'support' ? 'supported' : 'opposed'} this bill
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
