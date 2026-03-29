import BillListingPage from '@/components/BillListingPage'
import { getBills } from '@/lib/legisinfo'

export default async function SenateBillsPage() {
  const bills = (await getBills()).filter((bill) => bill.IsSenateBill)

  return (
    <BillListingPage
      title="Senate Bills"
      description="Bills that originated in the Senate, ordered by most recent activity."
      bills={bills}
      emptyMessage="There are no Senate bills in the current dataset."
    />
  )
}
