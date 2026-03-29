/**
 * Parliament of Canada LEGISinfo data layer.
 *
 * Primary source: the static public/bills.json snapshot (always available).
 *
 * Live fetch is opt-in via the LEGISINFO_EXPORT_URL environment variable.
 * Set it to the confirmed JSON export endpoint once you have it.
 * Without it the app works perfectly — the snapshot IS real Parliament data.
 *
 * To trigger a cache refresh: POST /api/bills/refresh { secret }
 */

import type { Bill } from './types'
import staticBills from '../public/bills.json'

export const LEGISINFO_CACHE_TAG = 'legisinfo-bills'

/**
 * Attempt a live fetch if LEGISINFO_EXPORT_URL is configured.
 * Returns null (not an error) when the env var is absent.
 */
async function fetchLiveBills(): Promise<Bill[] | null> {
  const exportUrl = process.env.LEGISINFO_EXPORT_URL
  if (!exportUrl) return null

  const res = await fetch(exportUrl, {
    next: {
      revalidate: 21_600, // 6 hours
      tags: [LEGISINFO_CACHE_TAG],
    },
    headers: {
      'User-Agent': 'ParliamentWatch/1.0',
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`LEGISinfo responded with HTTP ${res.status}`)
  }

  const data: unknown = await res.json()

  if (!Array.isArray(data)) {
    throw new Error('Unexpected LEGISinfo response — expected a JSON array')
  }

  return data as Bill[]
}

/**
 * Return bills sorted newest-activity-first.
 * Uses live data when LEGISINFO_EXPORT_URL is set, otherwise the snapshot.
 */
export async function getBills(): Promise<Bill[]> {
  try {
    const live = await fetchLiveBills()
    if (live) return sortByLatestActivity(live)
  } catch (err) {
    console.warn('[legisinfo] Live fetch failed, using snapshot:', err)
  }
  return sortByLatestActivity(staticBills as Bill[])
}

/**
 * Fetch a single bill by ID.
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
