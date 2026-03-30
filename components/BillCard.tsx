import Link from 'next/link'
import { Bill } from '@/lib/types'
import { formatStatusLabel, getStatusBadgeClass, getTopicTag } from '@/lib/bills'

export default function BillCard({ bill }: { bill: Bill }) {
  const topicTag = getTopicTag(bill)
  const statusClass = getStatusBadgeClass(bill.StatusNameEn)
  const statusLabel = formatStatusLabel(
    bill.LatestCompletedMajorStageNameWithChamberSuffix || bill.StatusNameEn
  )
  const lastActivity = new Date(bill.LatestBillEventDateTime).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link href={`/bills/${bill.Id}`}>
      <article className="ui-card ui-card-pad-lg ui-card-interactive group cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="ui-bill-code">{bill.NumberCode}</span>
            <span className="ui-tag-topic">{topicTag}</span>
            {bill.IsGovernmentBill && (
              <span className="ui-tag-muted">Gov&apos;t Bill</span>
            )}
          </div>
          <span className={statusClass}>{statusLabel}</span>
        </div>

        <h2 className="ui-title-link mb-1">
          {bill.ShortTitleEn || bill.LongTitleEn}
        </h2>
        <p className="text-sm ui-prose-muted ui-line-clamp-2 mb-3">{bill.LongTitleEn}</p>

        <div className="flex items-center justify-between ui-bill-meta">
          <span>
            Sponsored by{' '}
            <strong>{bill.SponsorPersonName}</strong>
            {bill.SponsorConstituencyName ? ` · ${bill.SponsorConstituencyName}` : ''}
          </span>
          <span>{lastActivity}</span>
        </div>
      </article>
    </Link>
  )
}
