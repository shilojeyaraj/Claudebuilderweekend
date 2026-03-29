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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-gray-400 hover:text-red-600 transition-colors mb-6 inline-block">
        ← All Bills
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 max-w-3xl">{description}</p>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Showing {bills.length} {bills.length === 1 ? 'bill' : 'bills'}
      </p>

      {bills.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-gray-400">
          {emptyMessage}
        </div>
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
