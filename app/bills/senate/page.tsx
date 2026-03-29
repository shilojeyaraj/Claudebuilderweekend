import BillListingPage from '@/components/BillListingPage'
import { getAllBills } from '@/lib/bills'

export default function SenateBillsPage() {
  const bills = getAllBills().filter((bill) => bill.IsSenateBill)

  return (
    <BillListingPage
      title="Senate Bills"
      description="Bills that originated in the Senate, ordered by most recent activity."
      bills={bills}
      emptyMessage="There are no Senate bills in the current dataset."
    />
  )
}
