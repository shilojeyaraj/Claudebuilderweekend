import HomePageClient from '@/components/HomePageClient'
import { getBills } from '@/lib/legisinfo'

export default async function Home() {
  const bills = await getBills()

  return <HomePageClient bills={bills} />
}
