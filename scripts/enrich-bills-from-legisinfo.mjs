import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BILLS_PATH = join(__dirname, '..', 'public', 'bills.json')
const DELAY_MS = 120

const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'ParliamentWatch/1.0 (legisinfo enrichment)',
}

const bills = JSON.parse(readFileSync(BILLS_PATH, 'utf8'))

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getBillUrl(bill) {
  const session = `${bill.ParliamentNumber}-${bill.SessionNumber}`
  return `https://www.parl.ca/legisinfo/en/bill/${session}/${bill.NumberCode.toLowerCase()}/json`
}

async function fetchOfficialBill(bill) {
  const res = await fetch(getBillUrl(bill), { headers: HEADERS })
  if (!res.ok) {
    throw new Error(`${bill.NumberCode} -> HTTP ${res.status}`)
  }

  const payload = await res.json()
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error(`${bill.NumberCode} -> empty response`)
  }

  return payload[0]
}

async function main() {
  let enrichedCount = 0

  for (let i = 0; i < bills.length; i += 1) {
    const bill = bills[i]
    process.stdout.write(`\rEnriching ${i + 1}/${bills.length}: ${bill.NumberCode}    `)

    try {
      const official = await fetchOfficialBill(bill)
      bills[i] = {
        ...bill,
        ...official,
      }
      if (official.ShortLegislativeSummaryEn) {
        enrichedCount += 1
      }
    } catch (error) {
      console.warn(`\nSkipping ${bill.NumberCode}: ${error.message}`)
    }

    await sleep(DELAY_MS)
  }

  bills.sort(
    (a, b) =>
      new Date(b.LatestBillEventDateTime).getTime() -
      new Date(a.LatestBillEventDateTime).getTime()
  )

  writeFileSync(BILLS_PATH, `${JSON.stringify(bills, null, 2)}\n`)
  console.log(`\nWrote ${bills.length} bills to public/bills.json`)
  console.log(`Bills with official summaries: ${enrichedCount}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
