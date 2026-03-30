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

  useEffect(() => {
    const stored = localStorage.getItem(`vote-${billId}`) as 'support' | 'oppose' | null
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoted(stored)
    }
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
    <div className="ui-card ui-card-pad">
      <h3 className="ui-section-title text-sm mb-1">What do Parliament Watch users think?</h3>
      <p className="ui-legal mb-4">Anonymous · one vote per bill</p>

      {!voted ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => castVote('support')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--ui-radius-md)] font-semibold text-sm transition-all disabled:opacity-50 bg-transparent ui-sentiment-yes"
          >
            <span className="text-lg" aria-hidden>👍</span> Support
          </button>
          <button
            type="button"
            onClick={() => castVote('oppose')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--ui-radius-md)] font-semibold text-sm transition-all disabled:opacity-50 bg-transparent ui-sentiment-no"
          >
            <span className="text-lg" aria-hidden>👎</span> Oppose
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[var(--ui-sentiment-yes-text)]">Support {supportPct}%</span>
            <span className="text-[var(--ui-sentiment-no-text)]">Oppose {opposePct}%</span>
          </div>
          <div className="ui-sentiment-track">
            <div
              className="ui-sentiment-fill"
              style={{ width: `${supportPct}%` }}
            />
          </div>
          <p className="ui-legal text-center">
            {total} {total === 1 ? 'response' : 'responses'} ·{' '}
            <span
              className={
                voted === 'support'
                  ? 'text-[var(--ui-sentiment-yes-text)]'
                  : 'text-[var(--ui-sentiment-no-text)]'
              }
            >
              You {voted === 'support' ? 'supported' : 'opposed'} this bill
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
