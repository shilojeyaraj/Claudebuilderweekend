import BillListingPage from '@/components/BillListingPage'
import { getAllBills } from '@/lib/bills'

export default function HouseBillsPage() {
  const bills = getAllBills().filter((bill) => bill.IsHouseBill)

  return (
    <BillListingPage
      title="House Bills"
      description="Bills that originated in the House of Commons, ordered by most recent activity."
      bills={bills}
      emptyMessage="There are no House bills in the current dataset."
    />
  )
}
