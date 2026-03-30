import { TOPIC_TAGS, getTopicTag } from '@/lib/bills'
import { Bill, UserInterests } from '@/lib/types'

export const USER_INTERESTS_STORAGE_KEY = 'pw-user-interests'

export const DEFAULT_USER_INTERESTS: UserInterests = {
  topics: [],
  customText: '',
}

const INTEREST_STOP_WORDS = new Set([
  'about',
  'after',
  'also',
  'because',
  'been',
  'being',
  'from',
  'have',
  'into',
  'just',
  'more',
  'that',
  'them',
  'they',
  'this',
  'those',
  'what',
  'when',
  'where',
  'with',
  'your',
])

export function sanitizeUserInterests(value: Partial<UserInterests> | null | undefined): UserInterests {
  const topics = Array.isArray(value?.topics)
    ? value.topics.filter((topic): topic is string => TOPIC_TAGS.includes(topic))
    : []

  return {
    topics: [...new Set(topics)],
    customText: typeof value?.customText === 'string' ? value.customText : '',
  }
}

export function extractInterestKeywords(customText: string): string[] {
  const normalized = customText.toLowerCase().trim()
  if (!normalized) return []

  const phrases = normalized
    .split(/[,\n]+/)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length >= 3)

  const keywords = new Set<string>(phrases)

  for (const word of normalized.match(/[a-z0-9]+/g) ?? []) {
    if (word.length < 3 || INTEREST_STOP_WORDS.has(word)) continue
    keywords.add(word)
  }

  return [...keywords]
}

export function getDisplayInterestKeywords(customText: string): string[] {
  const keywords = extractInterestKeywords(customText)
  const phrases = keywords.filter((keyword) => keyword.includes(' '))

  if (phrases.length === 0) {
    return keywords
  }

  return keywords.filter((keyword) => {
    if (keyword.includes(' ')) {
      return true
    }

    return !phrases.some((phrase) =>
      phrase
        .split(/\s+/)
        .map((word) => word.trim())
        .includes(keyword)
    )
  })
}

export function getBillInterestMatchScore(bill: Bill, customText: string): number {
  const keywords = extractInterestKeywords(customText)
  if (keywords.length === 0) return 0

  const haystack = [
    bill.NumberCode,
    bill.ShortTitleEn,
    bill.LongTitleEn,
    bill.ShortLegislativeSummaryEn ?? '',
    bill.StatusNameEn,
    bill.SponsorPersonName,
    getTopicTag(bill),
  ]
    .join(' ')
    .toLowerCase()

  return keywords.reduce((score, keyword) => {
    if (!haystack.includes(keyword)) return score
    return score + (keyword.includes(' ') ? 3 : 1)
  }, 0)
}
