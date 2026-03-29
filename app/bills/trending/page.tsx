import BillListingPage from '@/components/BillListingPage'
import { getBills } from '@/lib/legisinfo'

const TRENDING_LOOKBACK_DAYS = 30

export default async function TrendingBillsPage() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - TRENDING_LOOKBACK_DAYS)

  const bills = (await getBills()).filter(
    (bill) => new Date(bill.LatestBillEventDateTime) >= cutoff
  )

  return (
    <BillListingPage
      title="Trending Bills"
      description="Bills with parliamentary activity in the last 30 days. This is the fastest way to see what is actively moving right now."
      bills={bills}
      emptyMessage="No bills have moved in the last 30 days."
    />
  )
}
