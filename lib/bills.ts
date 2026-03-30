import { Bill } from './types'
import billsData from '../public/bills.json'

const bills = billsData as Bill[]

export function getAllBills(): Bill[] {
  return bills.sort(
    (a, b) =>
      new Date(b.LatestBillEventDateTime).getTime() -
      new Date(a.LatestBillEventDateTime).getTime()
  )
}

export function getBillById(id: number): Bill | undefined {
  return bills.find((b) => b.Id === id)
}

const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  HouseAt2ndReading: 'House at 2nd Reading',
  SenateAt2ndReading: 'Senate at 2nd Reading',
  SenateAt3rdReading: 'Senate at 3rd Reading',
  HouseAtReportStage: 'House at Report Stage',
  SenateAtReportStage: 'Senate at Report Stage',
  OutsideOrderPrecedence: 'Outside Order of Precedence',
  "Outside the Order of Precedence (a private member's bill that hasn't yet won the draw that determines which private member's bills can be debated)":
    'Outside Order of Precedence',
  SenateBillWaitingHouse: 'Senate Bill Awaiting House',
  BillDefeated: 'Bill Defeated',
  ProForma: 'Pro Forma',
}

export function formatStatusLabel(label: string): string {
  if (!label) return label
  if (STATUS_LABEL_OVERRIDES[label]) return STATUS_LABEL_OVERRIDES[label]

  return label
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d+(?:st|nd|rd|th))/g, '$1 $2')
    .replace(/(\d+(?:st|nd|rd|th))([A-Z])/g, '$1 $2')
    .trim()
}

// Derive a rough topic tag from the bill title for client-side filtering.
// LEGISinfo doesn't include subject classifications, so we keyword-match the long title.
export function getTopicTag(bill: Bill): string {
  const title = (bill.LongTitleEn + ' ' + bill.ShortTitleEn).toLowerCase()
  if (/health|care|medical|hospital|drug|pharma|mental|disease/.test(title)) return 'Health'
  if (/housing|home|rent|mortgage|shelter|homeless/.test(title)) return 'Housing'
  if (/environment|climate|carbon|emission|green|nature|wildlife|forest|ocean/.test(title)) return 'Environment'
  if (/indigenous|first nation|métis|inuit|treaty|reconcili/.test(title)) return 'Indigenous Affairs'
  if (/economy|tax|budget|finance|fiscal|trade|bank|invest|pension|employ/.test(title)) return 'Economy'
  if (/justice|criminal|court|crime|police|sentenc|prison|offend/.test(title)) return 'Justice'
  if (/transport|transit|highway|rail|aviation|port|vehicle/.test(title)) return 'Transport'
  if (/education|school|student|university|college|learn/.test(title)) return 'Education'
  if (/defence|military|veteran|armed force|national security/.test(title)) return 'Defence'
  if (/immigration|refugee|citizenship|visa|border/.test(title)) return 'Immigration'
  return 'Other'
}

export const TOPIC_TAGS = [
  'Health',
  'Housing',
  'Environment',
  'Indigenous Affairs',
  'Economy',
  'Justice',
  'Transport',
  'Education',
  'Defence',
  'Immigration',
  'Other',
]

export type BillStatusStage =
  | 'assented'
  | 'third'
  | 'second'
  | 'committee'
  | 'first'
  | 'default'

/** Normalised stage for themed UI badges and API consumers. */
export function getStatusStage(status: string): BillStatusStage {
  const s = status.toLowerCase()
  if (s.includes('royal assent')) return 'assented'
  if (s.includes('third reading')) return 'third'
  if (s.includes('second reading')) return 'second'
  if (s.includes('committee')) return 'committee'
  if (s.includes('first reading')) return 'first'
  return 'default'
}

/** Semantic classes — pair with globals.css theme tokens. */
export function getStatusBadgeClass(status: string): string {
  return `ui-status ui-status--${getStatusStage(status)}`
}

/** @deprecated Prefer getStatusBadgeClass in UI; kept for JSON API responses. */
export function getStatusColor(status: string): string {
  const stage = getStatusStage(status)
  const map: Record<BillStatusStage, string> = {
    assented: 'bg-green-100 text-green-800',
    third: 'bg-blue-100 text-blue-800',
    second: 'bg-yellow-100 text-yellow-800',
    committee: 'bg-purple-100 text-purple-800',
    first: 'bg-gray-100 text-gray-700',
    default: 'bg-gray-100 text-gray-600',
  }
  return map[stage]
}
