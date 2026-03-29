/**
 * Parliament of Canada LEGISinfo API client.
 *
 * Fetches bills for the current parliament/session and caches the result for
 * 6 hours via Next.js fetch caching.  Falls back to the bundled bills.json
 * snapshot when the live API is unreachable.
 */

import type { Bill } from './types'
import staticBills from '../public/bills.json'

const PARLIAMENT = 45
const SESSION = 1

export const LEGISINFO_CACHE_TAG = 'legisinfo-bills'

const LEGISINFO_URL =
  `https://www.parl.ca/LegisInfo/en/bills/export` +
  `?fileType=JSON&lang=en&parlSession=${PARLIAMENT}-${SESSION}`

/**
 * Fetch bills from the live LEGISinfo API.
 * Responses are cached by Next.js for 6 hours and tagged so they can be
 * invalidated on demand via revalidateTag().
 */
export async function fetchLiveBills(): Promise<Bill[]> {
  const res = await fetch(LEGISINFO_URL, {
    next: {
      revalidate: 21_600, // 6 hours
      tags: [LEGISINFO_CACHE_TAG],
    },
    headers: {
      'User-Agent': 'ParliamentWatch/1.0 (hackathon)',
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`LEGISinfo responded with HTTP ${res.status}`)
  }

  const data: unknown = await res.json()

  if (!Array.isArray(data)) {
    throw new Error('Unexpected LEGISinfo response shape — expected an array')
  }

  return data as Bill[]
}

/**
 * Return bills from LEGISinfo, falling back to the static snapshot on error.
 * Sorted newest-activity-first.
 */
export async function getBills(): Promise<Bill[]> {
  try {
    const bills = await fetchLiveBills()
    return sortByLatestActivity(bills)
  } catch (err) {
    console.error('[legisinfo] Live fetch failed, using static snapshot:', err)
    return sortByLatestActivity(staticBills as Bill[])
  }
}

/**
 * Fetch a single bill by ID.  Returns undefined when not found.
 */
export async function getLiveBillById(id: number): Promise<Bill | undefined> {
  const bills = await getBills()
  return bills.find((b) => b.Id === id)
}

function sortByLatestActivity(bills: Bill[]): Bill[] {
  return [...bills].sort(
    (a, b) =>
      new Date(b.LatestBillEventDateTime).getTime() -
      new Date(a.LatestBillEventDateTime).getTime()
  )
}
