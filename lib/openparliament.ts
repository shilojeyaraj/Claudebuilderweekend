/**
 * OpenParliament API client — api.openparliament.ca
 *
 * No auth required. All responses are cached via Next.js fetch caching and
 * tagged so they can be invalidated together via revalidateTag().
 */

const BASE = 'https://api.openparliament.ca'

export const OP_CACHE_TAG = 'openparliament'

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'ParliamentWatch/1.0 (hackathon)',
}

// ---------------------------------------------------------------------------
// OpenParliament response types
// ---------------------------------------------------------------------------

export interface OPBill {
  url: string                          // e.g. "/bills/45-1/C-56/"
  number: string                       // e.g. "C-56"
  name: { en: string; fr: string }
  session: string                      // e.g. "45-1"
  introduced: string | null            // ISO date
  sponsor_politician_url: string | null
  sponsor_politician_riding_url: string | null
  status: { en: string; fr: string } | null
  law: boolean
  privatemember: boolean
  subjects: string[]
}

export interface OPBillDetail extends OPBill {
  summary: { en: string; fr: string } | null
  home_chamber: string | null
  other_session_bills: string[]
}

export interface OPVote {
  url: string
  date: string
  number: number
  description: { en: string; fr: string }
  result: 'Passed' | 'Failed' | string
  yea_total: number
  nay_total: number
  paired_total: number
  nays_url: string
  yeas_url: string
  bill_url: string | null
}

export interface OPDebateSection {
  url: string
  date: string
  heading: string | null
  speaker_politician_url: string | null
  paragraph_count: number
  hansard_url: string
}

interface OPPaginated<T> {
  objects: T[]
  pagination: {
    next_url: string | null
    previous_url: string | null
    total_count: number
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function opFetch<T>(path: string, revalidate = 21_600): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: HEADERS,
    next: {
      revalidate,
      tags: [OP_CACHE_TAG],
    },
  })

  if (!res.ok) {
    throw new Error(`OpenParliament ${path} → HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the paginated list of bills for a given parliament session.
 * Fetches all pages and concatenates results.
 */
export async function fetchOPBills(session = '45-1'): Promise<OPBill[]> {
  const all: OPBill[] = []
  let nextPath: string | null = `/bills/?session=${session}&limit=200&format=json`

  while (nextPath) {
    const page: OPPaginated<OPBill> = await opFetch<OPPaginated<OPBill>>(nextPath)
    all.push(...page.objects)
    // next_url is a full URL — extract just the path + query
    if (page.pagination.next_url) {
      try {
        const u: URL = new URL(page.pagination.next_url)
        nextPath = u.pathname + u.search
      } catch {
        nextPath = null
      }
    } else {
      nextPath = null
    }
  }

  return all
}

/**
 * Fetch detail for a single bill.
 * @param session  e.g. "45-1"
 * @param number   e.g. "C-56"
 */
export async function fetchOPBill(
  session: string,
  number: string
): Promise<OPBillDetail | null> {
  try {
    return await opFetch<OPBillDetail>(`/bills/${session}/${number}/`)
  } catch {
    return null
  }
}

/**
 * Fetch votes associated with a bill.
 * @param billUrl  OpenParliament bill URL, e.g. "/bills/45-1/C-56/"
 */
export async function fetchVotes(billUrl: string): Promise<OPVote[]> {
  try {
    const encoded = encodeURIComponent(billUrl)
    const data = await opFetch<OPPaginated<OPVote>>(
      `/votes/?bill=${encoded}&limit=50&format=json`,
      3_600 // 1-hour cache for votes
    )
    return data.objects
  } catch {
    return []
  }
}

/**
 * Fetch Hansard debate sections that mention a bill.
 * @param billUrl  OpenParliament bill URL, e.g. "/bills/45-1/C-56/"
 */
export async function fetchDebates(billUrl: string): Promise<OPDebateSection[]> {
  try {
    const encoded = encodeURIComponent(billUrl)
    const data = await opFetch<OPPaginated<OPDebateSection>>(
      `/debates/?bill=${encoded}&limit=20&format=json`,
      3_600
    )
    return data.objects
  } catch {
    return []
  }
}
