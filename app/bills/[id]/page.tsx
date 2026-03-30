import { notFound } from 'next/navigation'
import { getLiveBillById } from '@/lib/legisinfo'
import { fetchOPBill } from '@/lib/openparliament'
import { formatStatusLabel, getBillDescription, getStatusBadgeClass, getTopicTag } from '@/lib/bills'
import ChatInterface from '@/components/ChatInterface'
import SentimentPoll from '@/components/SentimentPoll'
import MPContactWidget from '@/components/MPContactWidget'
import Link from 'next/link'

const STAGES = [
  'First reading',
  'Second reading',
  'Committee',
  'Third reading',
  'Royal Assent',
]

function getStageIndex(bill: Awaited<ReturnType<typeof getLiveBillById>>) {
  if (!bill) return 0
  if (bill.ReceivedRoyalAssent) return 4
  const stage = (bill.LatestCompletedMajorStageNameEn ?? '').toLowerCase()
  if (stage.includes('third')) return 3
  if (stage.includes('committee')) return 2
  if (stage.includes('second')) return 1
  return 0
}

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bill = await getLiveBillById(Number(id))
  if (!bill) notFound()

  const session = `${bill.ParliamentNumber}-${bill.SessionNumber}`
  const opBill = await fetchOPBill(session, bill.NumberCode)

  const enrichedBill = opBill?.summary?.en
    ? { ...bill, ShortLegislativeSummaryEn: opBill.summary.en }
    : bill

  const stageIndex = getStageIndex(bill)
  const statusClass = getStatusBadgeClass(bill.StatusNameEn)
  const statusLabel = formatStatusLabel(
    bill.LatestCompletedMajorStageNameWithChamberSuffix || bill.StatusNameEn
  )
  const description = getBillDescription(enrichedBill)
  const topic = getTopicTag(bill)

  const lastActivity = new Date(bill.LatestBillEventDateTime).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="ui-page">
      <Link href="/" className="ui-link mb-6 inline-block">
        ← All Bills
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="ui-card ui-card-pad-lg">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="ui-bill-code">{bill.NumberCode}</span>
              <span className="ui-tag-topic">{topic}</span>
              {bill.IsGovernmentBill && (
                <span className="ui-tag-muted">Government Bill</span>
              )}
              <span className={statusClass}>{statusLabel}</span>
            </div>

            <h1 className="ui-page-title leading-snug mb-1">
              {bill.ShortTitleEn || bill.LongTitleEn}
            </h1>
            <p className="ui-prose-muted mb-4">{description}</p>

            <div className="flex flex-wrap gap-4 text-sm ui-prose-muted">
              <span>
                <span className="text-[var(--ui-faint)]">Sponsor: </span>
                <strong className="text-[var(--ui-text)]">{bill.SponsorPersonName}</strong>
                {bill.SponsorAffiliationTitle ? ` (${bill.SponsorAffiliationTitle})` : ''}
                {bill.SponsorConstituencyName ? `, ${bill.SponsorConstituencyName}` : ''}
              </span>
              <span>
                <span className="text-[var(--ui-faint)]">Chamber: </span>
                <strong className="text-[var(--ui-text)]">{bill.OriginatingChamberNameEn}</strong>
              </span>
              <span>
                <span className="text-[var(--ui-faint)]">Last activity: </span>
                <strong className="text-[var(--ui-text)]">{lastActivity}</strong>
              </span>
            </div>
          </div>

          <div className="ui-card ui-card-pad-lg">
            <h2 className="ui-section-title mb-4">Legislative Progress</h2>
            <div className="flex items-center gap-1">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center w-full">
                    <div
                      className={`ui-step-dot ${
                        i <= stageIndex ? 'ui-step-dot--on' : 'ui-step-dot--off'
                      }`}
                    >
                      {i <= stageIndex ? '✓' : i + 1}
                    </div>
                    <span className="ui-step-label">{stage}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`ui-step-line ${
                        i < stageIndex ? 'ui-step-line--on' : 'ui-step-line--off'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 ui-legal">
              {bill.PassedSenateFirstReadingDateTime && (
                <span>
                  Senate 1st reading:{' '}
                  {new Date(bill.PassedSenateFirstReadingDateTime).toLocaleDateString('en-CA')}
                </span>
              )}
              {bill.PassedSenateSecondReadingDateTime && (
                <span>
                  Senate 2nd reading:{' '}
                  {new Date(bill.PassedSenateSecondReadingDateTime).toLocaleDateString('en-CA')}
                </span>
              )}
              {bill.PassedHouseFirstReadingDateTime && (
                <span>
                  House 1st reading:{' '}
                  {new Date(bill.PassedHouseFirstReadingDateTime).toLocaleDateString('en-CA')}
                </span>
              )}
              {bill.PassedHouseSecondReadingDateTime && (
                <span>
                  House 2nd reading:{' '}
                  {new Date(bill.PassedHouseSecondReadingDateTime).toLocaleDateString('en-CA')}
                </span>
              )}
              {bill.ReceivedRoyalAssentDateTime && (
                <span className="ui-highlight-positive col-span-2">
                  Royal Assent: {new Date(bill.ReceivedRoyalAssentDateTime).toLocaleDateString('en-CA')}
                </span>
              )}
            </div>
          </div>

          <div className="ui-card ui-card-pad-lg">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="ui-section-title">Ask about this bill</h2>
              <span className="ui-ai-badge">AI · Nonpartisan</span>
            </div>
            <p className="ui-legal mb-4">
              Powered by Claude Haiku. Explains only — never tells you how to vote.
            </p>
            <ChatInterface bill={enrichedBill} />
          </div>
        </div>

        <div className="space-y-4">
          <SentimentPoll billId={bill.Id} />

          <MPContactWidget billTitle={bill.ShortTitleEn || bill.LongTitleEn} billNumber={bill.NumberCode} />

          <div className="ui-card ui-card-pad">
            <h3 className="ui-section-title text-sm mb-2">Official Source</h3>
            <p className="ui-legal mb-3">
              All data sourced from Parliament of Canada&apos;s LEGISinfo.
            </p>
            <a
              href={`https://www.parl.ca/legisinfo/en/bill/${bill.ParliamentNumber}-${bill.SessionNumber}/${bill.NumberCode.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold ui-md-link inline-block"
            >
              View on LEGISinfo →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
