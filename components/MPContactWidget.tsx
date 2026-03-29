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

  // Pre-fills a mailto with context about the bill so the user has a starting point
  function buildMailto(mp: MPResult) {
    const subject = billNumber && billTitle
      ? encodeURIComponent(`Re: ${billNumber} — ${billTitle}`)
      : encodeURIComponent('Message from a constituent')
    const body = billNumber && billTitle
      ? encodeURIComponent(
          `Dear ${mp.name},\n\nI am writing to share my thoughts on ${billNumber} (${billTitle}), which is currently before Parliament.\n\n[Your message here]\n\nThank you for your service.\n\nSincerely,\n[Your name]\n[Your riding: ${mp.district}]`
        )
      : encodeURIComponent(
          `Dear ${mp.name},\n\nI am writing as a constituent in ${mp.district}.\n\n[Your message here]\n\nThank you for your service.\n\nSincerely,\n[Your name]`
        )
    return `mailto:${mp.email}?subject=${subject}&body=${body}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 text-sm mb-1">Contact Your MP</h3>
      <p className="text-xs text-gray-400 mb-3">
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
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 uppercase tracking-widest"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || postalCode.replace(/\s/g, '').length < 6}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-2 rounded-lg text-sm font-medium transition-colors"
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
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900 text-sm">{mp.name}</p>
              <p className="text-xs text-gray-500">{mp.party}</p>
              <p className="text-xs text-gray-400">{mp.district}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {mp.email && (
              <a
                href={buildMailto(mp)}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ✉️ Email {mp.name.split(' ').pop()}
              </a>
            )}
            <a
              href={mp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              View MP Profile →
            </a>
          </div>

          <button
            onClick={() => { setMp(null); setPostalCode('') }}
            className="text-xs text-gray-400 hover:text-gray-600 w-full text-center"
          >
            Search a different postal code
          </button>
        </div>
      )}
    </div>
  )
}
