import { notFound } from 'next/navigation'
import { getBillById, getStatusColor, getTopicTag } from '@/lib/bills'
import ChatInterface from '@/components/ChatInterface'
import SentimentPoll from '@/components/SentimentPoll'
import MPContactWidget from '@/components/MPContactWidget'
import Link from 'next/link'

// Legislative stages in order — used to render a progress bar
const STAGES = [
  'First reading',
  'Second reading',
  'Committee',
  'Third reading',
  'Royal Assent',
]

function getStageIndex(bill: Awaited<ReturnType<typeof getBillById>>) {
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
  const bill = getBillById(Number(id))
  if (!bill) notFound()

  const stageIndex = getStageIndex(bill)
  const statusColor = getStatusColor(bill.StatusNameEn)
  const topic = getTopicTag(bill)

  const lastActivity = new Date(bill.LatestBillEventDateTime).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/" className="text-sm text-gray-400 hover:text-red-600 transition-colors mb-6 inline-block">
        ← All Bills
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bill header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="font-mono text-sm font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                {bill.NumberCode}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                {topic}
              </span>
              {bill.IsGovernmentBill && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                  Government Bill
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                {bill.StatusNameEn}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-1">
              {bill.ShortTitleEn || bill.LongTitleEn}
            </h1>
            {bill.ShortTitleEn && (
              <p className="text-gray-500 text-sm mb-4">{bill.LongTitleEn}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <span className="text-gray-400">Sponsor: </span>
                <strong>{bill.SponsorPersonName}</strong>
                {bill.SponsorAffiliationTitle ? ` (${bill.SponsorAffiliationTitle})` : ''}
                {bill.SponsorConstituencyName ? `, ${bill.SponsorConstituencyName}` : ''}
              </span>
              <span>
                <span className="text-gray-400">Chamber: </span>
                <strong>{bill.OriginatingChamberNameEn}</strong>
              </span>
              <span>
                <span className="text-gray-400">Last activity: </span>
                <strong>{lastActivity}</strong>
              </span>
            </div>
          </div>

          {/* Legislative progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Legislative Progress</h2>
            <div className="flex items-center gap-1">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center w-full">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i <= stageIndex
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {i <= stageIndex ? '✓' : i + 1}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 text-center leading-tight">
                      {stage}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mb-4 ${
                        i < stageIndex ? 'bg-red-400' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Reading timestamps */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
              {bill.PassedSenateFirstReadingDateTime && (
                <span>Senate 1st reading: {new Date(bill.PassedSenateFirstReadingDateTime).toLocaleDateString('en-CA')}</span>
              )}
              {bill.PassedSenateSecondReadingDateTime && (
                <span>Senate 2nd reading: {new Date(bill.PassedSenateSecondReadingDateTime).toLocaleDateString('en-CA')}</span>
              )}
              {bill.PassedHouseFirstReadingDateTime && (
                <span>House 1st reading: {new Date(bill.PassedHouseFirstReadingDateTime).toLocaleDateString('en-CA')}</span>
              )}
              {bill.PassedHouseSecondReadingDateTime && (
                <span>House 2nd reading: {new Date(bill.PassedHouseSecondReadingDateTime).toLocaleDateString('en-CA')}</span>
              )}
              {bill.ReceivedRoyalAssentDateTime && (
                <span className="text-green-600 font-medium col-span-2">
                  Royal Assent: {new Date(bill.ReceivedRoyalAssentDateTime).toLocaleDateString('en-CA')}
                </span>
              )}
            </div>
          </div>

          {/* Claude Chat */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-gray-800">Ask about this bill</h2>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">AI · Nonpartisan</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Powered by Claude Haiku. Explains only — never tells you how to vote.
            </p>
            <ChatInterface bill={bill} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Sentiment pulse */}
          <SentimentPoll billId={bill.Id} />

          {/* Contact MP */}
          <MPContactWidget billTitle={bill.ShortTitleEn || bill.LongTitleEn} billNumber={bill.NumberCode} />

          {/* Official link */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">Official Source</h3>
            <p className="text-xs text-gray-500 mb-3">
              All data sourced from Parliament of Canada&apos;s LEGISinfo.
            </p>
            <a
              href={`https://www.parl.ca/legisinfo/en/bill/${bill.ParliamentNumber}-${bill.SessionNumber}/${bill.NumberCode.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-red-600 hover:text-red-800 underline font-medium"
            >
              View on LEGISinfo →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
