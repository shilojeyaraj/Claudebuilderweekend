import Link from 'next/link'
import { Bill } from '@/lib/types'
import { getStatusColor, getTopicTag } from '@/lib/bills'

export default function BillCard({ bill }: { bill: Bill }) {
  const topicTag = getTopicTag(bill)
  const statusColor = getStatusColor(bill.StatusNameEn)
  const lastActivity = new Date(bill.LatestBillEventDateTime).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link href={`/bills/${bill.Id}`}>
      <article className="bg-white rounded-xl border border-gray-200 p-5 hover:border-red-300 hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
              {bill.NumberCode}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
              {topicTag}
            </span>
            {bill.IsGovernmentBill && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                Gov&apos;t Bill
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColor}`}>
            {bill.LatestCompletedMajorStageNameWithChamberSuffix || bill.StatusNameEn}
          </span>
        </div>

        <h2 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors leading-snug mb-1">
          {bill.ShortTitleEn || bill.LongTitleEn}
        </h2>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{bill.LongTitleEn}</p>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            Sponsored by{' '}
            <span className="text-gray-600 font-medium">{bill.SponsorPersonName}</span>
            {bill.SponsorConstituencyName ? ` · ${bill.SponsorConstituencyName}` : ''}
          </span>
          <span>{lastActivity}</span>
        </div>
      </article>
    </Link>
  )
}
