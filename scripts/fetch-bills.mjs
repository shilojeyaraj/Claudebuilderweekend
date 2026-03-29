/**
 * Fetch all bills for the 45th Parliament from OpenParliament and write them
 * to public/bills.json in the shape our app expects.
 *
 * Usage:  node scripts/fetch-bills.mjs
 *
 * ~300-400 HTTP requests total. Takes about 60-90s.
 * Run whenever you want to refresh the bill data.
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'public', 'bills.json')

const BASE = 'https://api.openparliament.ca'
const SESSION = '45-1'
const PARLIAMENT = 45
const SESSION_NUMBER = 1
const DELAY_MS = 150

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'ParliamentWatch/1.0 (hackathon data fetch)',
}

// ── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function opGet(path) {
  await sleep(DELAY_MS)
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  return res.json()
}

// ── status code → human readable stage name ──────────────────────────────────

function stageName(statusCode) {
  const map = {
    HouseFirstReading: 'First reading',
    HouseSecondReading: 'Second reading',
    HouseInCommittee: 'Consideration in committee',
    HouseReportStage: 'Report stage',
    HouseThirdReading: 'Third reading',
    SenateFirstReading: 'Senate first reading',
    SenateSecondReading: 'Senate second reading',
    SenateInCommittee: 'Senate consideration in committee',
    SenateThirdReading: 'Senate third reading',
    RoyalAssentGiven: 'Royal assent',
    SenateAmendments: 'Senate amendments',
    HouseAmendments: 'Consideration of Senate amendments',
    OutsideOrderOfPrecedence: 'Outside the Order of Precedence',
  }
  return map[statusCode] ?? statusCode ?? ''
}

// ── map OP bill → our Bill shape ─────────────────────────────────────────────

function mapBill(detail, sponsor) {
  const prefix = detail.number.split('-')[0]   // 'C' or 'S'
  const num = parseInt(detail.number.split('-')[1], 10)
  const isHouse = detail.home_chamber === 'House'
  const isSenate = detail.home_chamber === 'Senate'
  const stage = stageName(detail.status_code)
  const isLaw = !!detail.law

  // Best proxy for "last activity" is introduced date; OP doesn't expose
  // per-event timestamps in the list API.
  const lastActivity = detail.introduced ?? new Date().toISOString().slice(0, 10)

  return {
    Id: detail.legisinfo_id,
    NumberCode: detail.number,
    NumberPrefix: prefix,
    Number: num,
    LongTitleEn: detail.name?.en ?? '',
    ShortTitleEn: detail.short_title?.en ?? '',
    StatusNameEn: detail.status?.en ?? '',
    LatestCompletedMajorStageNameEn: stage,
    LatestCompletedMajorStageNameWithChamberSuffix: stage,
    OngoingStageNameEn: isLaw ? '' : stage,
    IsGovernmentBill: !detail.private_member_bill,
    IsHouseBill: isHouse,
    IsSenateBill: isSenate,
    OriginatingChamberNameEn: isHouse ? 'House of Commons' : 'Senate',
    SponsorPersonName: sponsor?.name ?? '',
    SponsorAffiliationTitle: sponsor?.party ?? '',
    SponsorConstituencyName: sponsor?.riding ?? '',
    LatestBillEventDateTime: lastActivity + 'T00:00:00',
    LatestBillEventTypeNameEn: detail.status?.en ?? '',
    ParliamentNumber: PARLIAMENT,
    SessionNumber: SESSION_NUMBER,
    PassedHouseFirstReadingDateTime: null,
    PassedHouseSecondReadingDateTime: null,
    PassedHouseThirdReadingDateTime: null,
    PassedSenateFirstReadingDateTime: null,
    PassedSenateSecondReadingDateTime: null,
    PassedSenateThirdReadingDateTime: null,
    ReceivedRoyalAssentDateTime: isLaw ? (lastActivity + 'T00:00:00') : null,
    ReceivedRoyalAssent: isLaw,
    ShortLegislativeSummaryEn: detail.summary?.en ?? null,
    BillDocumentTypeNameEn: detail.private_member_bill ? 'Private Member\'s Bill' : 'Government Bill',
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching bills for session ${SESSION} from OpenParliament…`)

  // 1. Get full paginated list
  const allBills = []
  let nextPath = `/bills/?session=${SESSION}&format=json&limit=200`
  while (nextPath) {
    const page = await opGet(nextPath)
    allBills.push(...page.objects)
    if (page.pagination.next_url) {
      const u = new URL(page.pagination.next_url)
      nextPath = u.pathname + u.search
    } else {
      nextPath = null
    }
  }
  console.log(`  Found ${allBills.length} bills in list.`)

  // 2. Fetch detail for each bill + cache politician memberships
  const membershipCache = new Map()

  async function getSponsor(membershipUrl) {
    if (!membershipUrl) return null
    if (membershipCache.has(membershipUrl)) return membershipCache.get(membershipUrl)
    try {
      const m = await opGet(`${membershipUrl}?format=json`)
      const sponsor = {
        name: null,                          // filled below via politician URL
        party: m.party?.short_name?.en ?? m.party?.name?.en ?? '',
        riding: m.riding?.name?.en ?? '',
      }
      // Fetch politician name
      if (m.politician_url) {
        const pol = await opGet(`${m.politician_url}?format=json`)
        sponsor.name = pol.name ?? ''
      }
      membershipCache.set(membershipUrl, sponsor)
      return sponsor
    } catch (e) {
      console.warn(`  Could not fetch membership ${membershipUrl}:`, e.message)
      membershipCache.set(membershipUrl, null)
      return null
    }
  }

  const mapped = []
  for (let i = 0; i < allBills.length; i++) {
    const stub = allBills[i]
    process.stdout.write(`\r  Processing ${i + 1}/${allBills.length}: ${stub.number}        `)

    try {
      const detail = await opGet(`${stub.url}?format=json`)
      const sponsor = await getSponsor(detail.sponsor_politician_membership_url ?? null)
      mapped.push(mapBill(detail, sponsor))
    } catch (e) {
      console.warn(`\n  Skipping ${stub.number}: ${e.message}`)
      // Fall back to stub-only mapping
      mapped.push(mapBill({ ...stub, status_code: null, private_member_bill: false }, null))
    }
  }

  console.log(`\n  Mapped ${mapped.length} bills.`)

  // 3. Sort newest first by introduced date
  mapped.sort((a, b) =>
    new Date(b.LatestBillEventDateTime).getTime() -
    new Date(a.LatestBillEventDateTime).getTime()
  )

  // 4. Write
  writeFileSync(OUT_PATH, JSON.stringify(mapped, null, 2))
  console.log(`✓ Wrote ${mapped.length} bills to public/bills.json`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
