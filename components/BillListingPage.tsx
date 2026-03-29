import Link from 'next/link'
import BillCard from '@/components/BillCard'
import { Bill } from '@/lib/types'

export default function BillListingPage({
  title,
  description,
  bills,
  emptyMessage,
}: {
  title: string
  description: string
  bills: Bill[]
  emptyMessage: string
}) {
  return (
    <div className="ui-page">
      <Link href="/" className="ui-link mb-6 inline-block">
        ← All Bills
      </Link>

      <div className="mb-8">
        <h1 className="ui-page-title">{title}</h1>
        <p className="ui-hero-sub max-w-3xl">{description}</p>
      </div>

      <p className="ui-muted-count mb-4">
        Showing {bills.length} {bills.length === 1 ? 'bill' : 'bills'}
      </p>

      {bills.length === 0 ? (
        <div className="ui-dashed-empty">{emptyMessage}</div>
      ) : (
        <div className="grid gap-4">
          {bills.map((bill) => (
            <BillCard key={bill.Id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  )
}
