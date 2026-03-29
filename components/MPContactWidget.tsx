'use client'

import { useState } from 'react'
import { MPResult } from '@/lib/types'

export default function MPContactWidget({
  billTitle,
  billNumber,
}: {
  billTitle?: string
  billNumber?: string
}) {
  const [postalCode, setPostalCode] = useState('')
  const [mp, setMp] = useState<MPResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function lookupMP(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMp(null)
    setLoading(true)

    const res = await fetch(`/api/mp?postal_code=${encodeURIComponent(postalCode)}`)
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Could not find your MP. Check your postal code and try again.')
    } else {
      setMp(data)
    }
    setLoading(false)
  }

  function buildMailto(mpResult: MPResult) {
    const subject = billNumber && billTitle
      ? encodeURIComponent(`Re: ${billNumber} — ${billTitle}`)
      : encodeURIComponent('Message from a constituent')
    const body = billNumber && billTitle
      ? encodeURIComponent(
          `Dear ${mpResult.name},\n\nI am writing to share my thoughts on ${billNumber} (${billTitle}), which is currently before Parliament.\n\n[Your message here]\n\nThank you for your service.\n\nSincerely,\n[Your name]\n[Your riding: ${mpResult.district}]`
        )
      : encodeURIComponent(
          `Dear ${mpResult.name},\n\nI am writing as a constituent in ${mpResult.district}.\n\n[Your message here]\n\nThank you for your service.\n\nSincerely,\n[Your name]`
        )
    return `mailto:${mpResult.email}?subject=${subject}&body=${body}`
  }

  return (
    <div className="ui-card ui-card-pad">
      <h3 className="ui-section-title text-sm mb-1">Contact Your MP</h3>
      <p className="ui-legal mb-3">
        Enter your postal code to find your Member of Parliament and open their contact details.
      </p>

      {!mp ? (
        <form onSubmit={lookupMP} className="flex flex-col gap-2">
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
            placeholder="e.g. M5V 2T6"
            maxLength={7}
            className="ui-input uppercase tracking-widest"
          />
          {error && (
            <p className="text-xs text-[var(--ui-sentiment-no-text)] font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || postalCode.replace(/\s/g, '').length < 6}
            className="ui-btn-primary"
          >
            {loading ? 'Looking up…' : 'Find My MP'}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {mp.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mp.photo_url}
                alt={mp.name}
                className="w-12 h-12 rounded-full object-cover border border-[var(--ui-border)]"
              />
            )}
            <div>
              <p className="font-semibold text-sm text-[var(--ui-text)]">{mp.name}</p>
              <p className="ui-legal">{mp.party}</p>
              <p className="ui-legal">{mp.district}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {mp.email && (
              <a
                href={buildMailto(mp)}
                className="ui-btn-primary flex items-center justify-center gap-2 no-underline text-center"
              >
                ✉️ Email {mp.name.split(' ').pop()}
              </a>
            )}
            <a
              href={mp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn-secondary flex items-center justify-center gap-2 no-underline text-center"
            >
              View MP Profile →
            </a>
          </div>

          <button
            type="button"
            onClick={() => { setMp(null); setPostalCode('') }}
            className="text-xs text-[var(--ui-faint)] hover:text-[var(--ui-accent)] transition-colors w-full text-center bg-transparent border-0 cursor-pointer"
          >
            Search a different postal code
          </button>
        </div>
      )}
    </div>
  )
}
