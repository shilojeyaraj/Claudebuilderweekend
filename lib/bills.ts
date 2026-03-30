import { Bill } from './types'
import billsData from '../public/bills.json'

const bills = billsData as Bill[]
const SUMMARY_MAX_LENGTH = 220
const SUMMARY_BOILERPLATE_PATTERNS = [
  /^The Library of Parliament does not prepare Legislative Summaries[^.]*\.\s*/i,
  /^A legislative summary is currently being prepared[^.]*\.\s*/i,
  /^Meanwhile, the following executive summary is available\.\s*/i,
  /^The following is a short summary:\s*/i,
  /^On \d{1,2} [A-Z][a-z]+ \d{4}, .*? first reading\.\s*/i,
]

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

export function stripHtmlToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&mdash;/gi, '-')
    .replace(/&ndash;/gi, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength).replace(/[ ,;:]+$/g, '')
  return `${truncated}...`
}

function summarizeTitleAsDescription(bill: Bill): string {
  const title = (bill.LongTitleEn || bill.ShortTitleEn || '').trim().replace(/\.$/, '')

  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^An Act to amend (.+)$/i, (match) => `This bill would amend ${match[1]}.`],
    [/^An Act respecting (.+)$/i, (match) => `This bill sets out rules for ${match[1]}.`],
    [/^An Act to establish (.+)$/i, (match) => `This bill would establish ${match[1]}.`],
    [/^An Act to implement (.+)$/i, (match) => `This bill would implement ${match[1]}.`],
    [/^An Act to enact (.+)$/i, (match) => `This bill would enact ${match[1]}.`],
    [/^An Act to authorize (.+)$/i, (match) => `This bill would authorize ${match[1]}.`],
    [/^An Act for granting to His Majesty certain sums of money (.+)$/i, (match) => `This bill authorizes government spending ${match[1]}.`],
  ]

  for (const [pattern, format] of patterns) {
    const match = title.match(pattern)
    if (match) {
      return truncateText(format(match), SUMMARY_MAX_LENGTH)
    }
  }

  return truncateText(title, SUMMARY_MAX_LENGTH)
}

export function getBillDescription(bill: Bill, maxLength = SUMMARY_MAX_LENGTH): string {
  const summarySource = bill.ShortLegislativeSummaryEn
    ? stripHtmlToText(bill.ShortLegislativeSummaryEn)
    : ''

  let summary = summarySource

  for (const pattern of SUMMARY_BOILERPLATE_PATTERNS) {
    summary = summary.replace(pattern, '')
  }

  summary = summary.replace(/\bThis enactment\b/gi, 'This bill')
  summary = summary.replace(/\bThe enactment\b/gi, 'The bill')

  if (summary) {
    const sentences = summary
      .split(/(?<=[.?!])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)

    let combined = ''
    for (const sentence of sentences) {
      const next = combined ? `${combined} ${sentence}` : sentence
      if (next.length > maxLength) break
      combined = next
      if (combined.length >= maxLength * 0.7) break
    }

    return truncateText(combined || sentences[0], maxLength)
  }

  return truncateText(summarizeTitleAsDescription(bill), maxLength)
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
