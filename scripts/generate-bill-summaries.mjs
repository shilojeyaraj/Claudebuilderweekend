import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BILLS_PATH = join(__dirname, '..', 'public', 'bills.json')
const OUT_PATH = join(__dirname, '..', 'lib', 'bill-summaries.generated.ts')

const MAX_LENGTH = 190
const SUMMARY_BOILERPLATE_PATTERNS = [
  /^The Library of Parliament does not prepare Legislative Summaries[^.]*\.\s*/i,
  /^A legislative summary is currently being prepared[^.]*\.\s*/i,
  /^Meanwhile, the following executive summary is available\.\s*/i,
  /^The following is a short summary:\s*/i,
  /^On \d{1,2} [A-Z][a-z]+ \d{4}, .*? first reading\.\s*/i,
]

const MANUAL_OVERRIDES = {
  'C-23': 'This bill authorizes federal spending for the remainder of the 2025-26 fiscal year.',
  'C-24': 'This bill authorizes federal spending for the start of the 2026-27 fiscal year.',
  'S-5': 'This bill would require health IT systems to work together and stop vendors from blocking health data sharing.',
  'C-12': 'This bill would tighten border security, strengthen immigration enforcement, and make related security changes.',
  'C-9': 'This bill would strengthen laws on hate propaganda, hate crimes, and access to religious or cultural places.',
  'C-8': 'This bill would create new cyber security rules, amend the Telecommunications Act, and make related changes.',
  'S-205': 'This bill would change correctional law to limit isolation and strengthen oversight and remedies in prisons.',
  'S-209': 'This bill would restrict young people’s online access to pornographic material.',
  'S-214': 'This bill would change sanctions law to allow the disposal of foreign state assets.',
  'S-217': 'This bill would require reporting on unpaid income tax to help measure the tax gap.',
  'C-25': 'This bill would change federal election rules and rename certain electoral districts.',
  'C-26': 'This bill would authorize federal payments aimed at improving housing supply.',
  'C-27': 'This bill would bring the final self-government agreement for the Tlegohli Got’ine into law.',
  'C-236': 'This bill would change criminal and corrections law to address the ongoing victimization of homicide victims’ families.',
  'C-242': 'This bill would change criminal justice rules on bail and related Department of Justice provisions.',
  'S-222': 'This bill would lower the federal voting age to 16 for elections and referendums.',
  'C-10': 'This bill would create a Commissioner for Modern Treaty Implementation.',
  'C-267': 'This bill would create a national framework to improve the durability of electronics and essential home appliances.',
  'C-263': 'This bill would create a national framework for silver alerts to help locate missing older adults.',
  'C-20': 'This bill would establish Build Canada Homes as a federal Crown corporation.',
  'C-14': 'This bill would change criminal, youth justice, and military law on bail and sentencing.',
  'C-4': 'This bill would cut the lowest personal income tax rate, create a temporary GST rebate for first-time home buyers, repeal the fuel charge, and change party privacy rules.',
  'C-22': 'This bill would modernize lawful access rules for getting data and information during investigations.',
  'C-18': 'This bill would implement the Canada-Indonesia comprehensive economic partnership agreement.',
  'S-2': 'This bill would expand Indian Act registration entitlements.',
  'S-6': 'This bill would further harmonize federal law with Quebec civil law and update related statutes.',
  'C-19': 'This bill would temporarily increase the GST/HST credit through the Canada Groceries and Essentials Benefit.',
  'C-21': 'This bill would bring the Red River Métis self-government treaty into law and make related changes.',
  'C-11': 'This bill would modernize the military justice system and amend related laws.',
  'C-16': 'This bill would change criminal and correctional law on child protection, gender-based violence, delays, and related measures.',
  'C-17': 'This bill authorizes government spending for the first part of the 2025-26 fiscal year.',
  'C-3': 'This bill would restore and extend citizenship by descent in certain cases and create a substantial-connection test for future cases.',
  'S-1001': 'This bill would let Gore Mutual Insurance Company continue as a Quebec corporation.',
  'C-2': 'This bill would strengthen Canada-U.S. border security and make related public safety changes.',
  'C-13': 'This bill would implement the United Kingdom’s accession protocol to the CPTPP trade agreement.',
  'C-15': 'This bill would implement measures from the federal budget tabled on November 4, 2025.',
  'C-6': 'This bill authorizes federal spending for the start of the 2025-26 fiscal year.',
  'C-7': 'This bill authorizes additional federal spending for the 2025-26 fiscal year.',
  'C-5': 'This bill would reduce interprovincial trade barriers and improve labour mobility in Canada.',
  'C-208': 'This bill would recognize a national livestock brand as a symbol of Canada and western frontier heritage.',
  'C-212': 'This bill would create an ombud office for the Department of Citizenship and Immigration and make related legal changes.',
  'C-214': 'This bill would require development of a national renewable energy strategy.',
  'C-216': 'This bill would enact the Protection of Minors in the Digital Age Act and amend two related laws.',
  'C-219': 'This bill would strengthen Magnitsky-style sanctions and foreign affairs rules and make related broadcasting changes.',
  'C-240': 'This bill would change criminal, corrections, and drug laws to promote offender rehabilitation.',
  'C-248': 'This bill would require a pan-Canadian conference on time change.',
  'C-268': 'This bill would establish the Spectrum Policy Framework for Canada.',
  'C-1': 'This bill continues the traditional pro forma first bill in the House of Commons.',
  'S-1': 'This bill continues the traditional pro forma first bill in the Senate.',
  'S-3': 'This bill would update measurement and inspection rules for weights, electricity, and gas systems.',
  'S-232': 'This bill would set rules on the use and limits of non-disclosure agreements.',
  'S-235': 'This bill would establish a national strategy to combat human trafficking.',
  'S-238': 'This bill would enact the Climate-Aligned Finance Act and make related changes to other laws.',
  'S-240': 'This bill would create a notwithstanding-clause exception for certain mandatory minimum sentences involving child sexual abuse material offences.',
  'S-242': 'This bill would require national action to prevent intimate partner violence.',
}

function readBills() {
  return JSON.parse(readFileSync(BILLS_PATH, 'utf8'))
}

function stripHtmlToText(value) {
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

function truncateText(text, maxLength = MAX_LENGTH) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).replace(/[ ,;:]+$/g, '')}...`
}

function sentenceCase(value) {
  if (!value) return value
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function stripTrailingPeriod(value) {
  return value.replace(/\.$/, '').trim()
}

function normalizeNounPhrase(value) {
  return stripTrailingPeriod(value)
    .replace(/^the\s+/i, '')
    .replace(/^a\s+/i, '')
    .replace(/^an\s+/i, '')
    .replace(/^the month of /i, '')
    .trim()
}

function cleanOfficialSummary(value) {
  let summary = stripHtmlToText(value)
  for (const pattern of SUMMARY_BOILERPLATE_PATTERNS) {
    summary = summary.replace(pattern, '')
  }

  summary = summary
    .replace(/\bThis enactment\b/gi, 'This bill')
    .replace(/\bThe enactment\b/gi, 'The bill')
    .trim()

  if (!summary) return ''

  const sentences = summary
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  if (sentences.length === 0) return ''

  let combined = ''
  for (const sentence of sentences) {
    const next = combined ? `${combined} ${sentence}` : sentence
    if (next.length > MAX_LENGTH) break
    combined = next
    if (combined.length >= MAX_LENGTH * 0.72) break
  }

  return truncateText(combined || sentences[0])
}

function summarizeFromTitle(bill) {
  const shortTitle = stripTrailingPeriod((bill.ShortTitleEn || '').trim())
  const longTitle = stripTrailingPeriod((bill.LongTitleEn || shortTitle).trim())

  const patterns = [
    [/^An Act to amend (.+?) and to establish a framework for (.+)$/i, ([, act, topic]) => `This bill would amend ${act} and create a framework for ${normalizeNounPhrase(topic)}.`],
    [/^An Act to amend (.+?), to make consequential amendments to other Acts and to repeal (.+)$/i, ([, act, repealedThing]) => `This bill would amend ${act}, make related changes to other laws, and repeal ${normalizeNounPhrase(repealedThing)}.`],
    [/^An Act to amend (.+?) and to make consequential amendments to other Acts \((.+)\)$/i, ([, act, topic]) => `This bill would amend ${act}, make related changes to other laws, and address ${sentenceCase(topic)}.`],
    [/^An Act to amend (.+?) \((.+)\)$/i, ([, act, topic]) => `This bill would amend ${act} on ${sentenceCase(topic)}.`],
    [/^An Act to amend (.+?) and to enact (.+)$/i, ([, amendedAct, enactedAct]) => `This bill would amend ${amendedAct} and enact ${normalizeNounPhrase(enactedAct)}.`],
    [/^An Act to amend (.+?) and make consequential amendments to other Acts$/i, ([, act]) => `This bill would amend ${act} and make related changes to other laws.`],
    [/^An Act to amend certain Acts in relation to (.+)$/i, ([, topic]) => `This bill would amend several laws relating to ${normalizeNounPhrase(topic)}.`],
    [/^An Act to amend (.+?)$/i, ([, act]) => `This bill would amend ${act}.`],
    [/^An Act to establish a national (framework|strategy) (for|on|respecting) (.+)$/i, ([, type, prep, topic]) => `This bill would create a national ${type} ${prep} ${normalizeNounPhrase(topic)}.`],
    [/^An Act to establish a national framework to (.+)$/i, ([, action]) => `This bill would create a national framework to ${sentenceCase(action)}.`],
    [/^An Act to establish a national strategy to (.+)$/i, ([, action]) => `This bill would create a national strategy to ${sentenceCase(action)}.`],
    [/^An Act to establish national (strategy|framework) (on|for|respecting) (.+)$/i, ([, type, prep, topic]) => `This bill would create a national ${type} ${prep} ${normalizeNounPhrase(topic)}.`],
    [/^An Act to establish a framework for (.+)$/i, ([, topic]) => `This bill would create a framework for ${normalizeNounPhrase(topic)}.`],
    [/^An Act to establish (.+)$/i, ([, subject]) => `This bill would establish ${normalizeNounPhrase(subject)}.`],
    [/^An Act respecting the development of a national strategy (?:for|respecting) (.+)$/i, ([, topic]) => `This bill would require a national strategy for ${normalizeNounPhrase(topic)}.`],
    [/^An Act to develop a national framework (?:for|on|respecting) (.+)$/i, ([, topic]) => `This bill would create a national framework for ${normalizeNounPhrase(topic)}.`],
    [/^An Act respecting the Commissioner for (.+)$/i, ([, topic]) => `This bill would create a Commissioner for ${topic}.`],
    [/^An Act respecting the establishment and award of (.+)$/i, ([, subject]) => `This bill would create ${normalizeNounPhrase(subject)}.`],
    [/^An Act respecting (.+? (?:Month|Week|Day))$/i, ([, subject]) => `This bill would designate ${normalizeNounPhrase(subject)}.`],
    [/^An Act respecting a (.+)$/i, ([, subject]) => `This bill would create ${normalizeNounPhrase(subject)}.`],
    [/^An Act respecting (.+)$/i, ([, subject]) => `This bill would set rules for ${normalizeNounPhrase(subject)}.`],
    [/^An Act to implement certain provisions of the budget tabled in Parliament on (.+)$/i, ([, date]) => `This bill would implement measures from the federal budget tabled on ${date}.`],
    [/^An Act to implement (.+)$/i, ([, subject]) => `This bill would implement ${normalizeNounPhrase(subject)}.`],
    [/^An Act to enact (.+)$/i, ([, subject]) => `This bill would enact ${normalizeNounPhrase(subject)}.`],
    [/^An Act to authorize certain payments.*for the purpose of (.+)$/i, ([, purpose]) => `This bill would authorize federal payments for ${sentenceCase(purpose)}.`],
    [/^An Act to authorize (.+)$/i, ([, subject]) => `This bill would authorize ${normalizeNounPhrase(subject)}.`],
    [/^An Act to give effect to (.+)$/i, ([, subject]) => `This bill would bring ${normalizeNounPhrase(subject)} into law.`],
    [/^An Act to repeal (.+)$/i, ([, subject]) => `This bill would repeal ${normalizeNounPhrase(subject)}.`],
    [/^An Act to declare (.+)$/i, ([, subject]) => `This bill would declare ${normalizeNounPhrase(subject)}.`],
    [/^An Act to designate (.+?) as (.+)$/i, ([, , designation]) => `This bill would designate ${normalizeNounPhrase(designation)}.`],
    [/^An Act to recognize (.+)$/i, ([, subject]) => `This bill would recognize ${normalizeNounPhrase(subject)}.`],
    [/^An Act to restrict (.+)$/i, ([, subject]) => `This bill would restrict ${normalizeNounPhrase(subject)}.`],
    [/^An Act to prohibit (.+)$/i, ([, subject]) => `This bill would prohibit ${normalizeNounPhrase(subject)}.`],
    [/^An Act to protect (.+)$/i, ([, subject]) => `This bill would protect ${normalizeNounPhrase(subject)}.`],
    [/^An Act to provide (.+)$/i, ([, subject]) => `This bill would provide ${normalizeNounPhrase(subject)}.`],
    [/^An Act for granting to His Majesty certain sums of money (.+)$/i, ([, purpose]) => `This bill authorizes government spending ${sentenceCase(purpose)}.`],
  ]

  for (const [pattern, format] of patterns) {
    const match = longTitle.match(pattern)
    if (match) return truncateText(format(match))
  }

  if (/^Appropriation Act No\./i.test(shortTitle)) {
    return truncateText(`This bill authorizes federal spending under ${shortTitle}.`)
  }

  if (/^Budget .* Implementation Act/i.test(shortTitle)) {
    return truncateText(`This bill would implement measures from the federal budget under ${shortTitle}.`)
  }

  if (/Act$/i.test(shortTitle)) {
    return truncateText(`This bill would enact measures under ${shortTitle}.`)
  }

  return truncateText(longTitle || shortTitle)
}

function buildSummary(bill) {
  const code = bill.NumberCode
  if (MANUAL_OVERRIDES[code]) return MANUAL_OVERRIDES[code]

  const officialSummary = bill.ShortLegislativeSummaryEn
    ? cleanOfficialSummary(bill.ShortLegislativeSummaryEn)
    : ''

  if (officialSummary) return officialSummary

  return summarizeFromTitle(bill)
}

function toTsObject(entries) {
  const lines = entries.map(
    ([code, summary]) => `  ${JSON.stringify(code)}: ${JSON.stringify(summary)},`
  )

  return `// Generated from public/bills.json.\n// Run \`npm run generate-bill-summaries\` to refresh.\n\nexport const PREWRITTEN_BILL_SUMMARIES: Record<string, string> = {\n${lines.join('\n')}\n}\n`
}

function main() {
  const bills = readBills()
  const entries = bills
    .map((bill) => [bill.NumberCode, buildSummary(bill)])
    .sort((a, b) => a[0].localeCompare(b[0], 'en-CA', { numeric: true }))

  writeFileSync(OUT_PATH, toTsObject(entries))
  console.log(`Wrote ${entries.length} prewritten bill summaries to ${OUT_PATH}`)
}

main()
