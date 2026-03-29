import BillListingPage from '@/components/BillListingPage'
import { getBills } from '@/lib/legisinfo'

export default async function HouseBillsPage() {
  const bills = (await getBills()).filter((bill) => bill.IsHouseBill)

  return (
    <BillListingPage
      title="House Bills"
      description="Bills that originated in the House of Commons, ordered by most recent activity."
      bills={bills}
      emptyMessage="There are no House bills in the current dataset."
    />
  )
}
