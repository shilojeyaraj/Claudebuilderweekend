'use client'

import { useState, useMemo } from 'react'
import BillCard from '@/components/BillCard'
import { getAllBills, getTopicTag, TOPIC_TAGS } from '@/lib/bills'

const CHAMBERS = ['All', 'House', 'Senate']

export default function Home() {
  const bills = getAllBills()
  const [search, setSearch] = useState('')
  const [chamber, setChamber] = useState('All')
  const [topic, setTopic] = useState('All')

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      const matchesChamber =
        chamber === 'All' ||
        (chamber === 'House' && b.IsHouseBill) ||
        (chamber === 'Senate' && b.IsSenateBill)

      const matchesTopic = topic === 'All' || getTopicTag(b) === topic

      const matchesSearch =
        search === '' ||
        b.ShortTitleEn.toLowerCase().includes(search.toLowerCase()) ||
        b.LongTitleEn.toLowerCase().includes(search.toLowerCase()) ||
        b.NumberCode.toLowerCase().includes(search.toLowerCase()) ||
        b.SponsorPersonName.toLowerCase().includes(search.toLowerCase())

      return matchesChamber && matchesTopic && matchesSearch
    })
  }, [bills, chamber, topic, search])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          What is Parliament working on right now?
        </h1>
        <p className="text-gray-500 max-w-2xl">
          A nonpartisan tracker of active bills in the Canadian House of Commons and Senate.
          Ask our AI assistant to explain any bill in plain language.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search bills, sponsors, keywords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        <select
          value={chamber}
          onChange={(e) => setChamber(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          {CHAMBERS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          <option>All</option>
          {TOPIC_TAGS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">
        Showing {filtered.length} of {bills.length} bills
      </p>

      {/* Bill grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No bills match your filters. Try broadening your search.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((bill) => (
            <BillCard key={bill.Id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  )
}
